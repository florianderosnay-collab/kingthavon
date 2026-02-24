import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

// Module-level singleton — instantiated once per Node process lifetime.
const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // ─── assistant-request ──────────────────────────────────────────────────
        // Critical path: must return the assistant config as fast as possible.
        // Single DB query over Neon HTTP — no TCP handshake, targets <150ms.
        if (body.message.type === 'assistant-request') {
            const call = body.message.call;
            const vapiPhoneNumber = call.customer?.number
                ? call.phone_number
                : (call.phone_number || undefined);

            if (!vapiPhoneNumber) {
                return NextResponse.json(
                    { error: 'No phone number provided' },
                    { status: 400 }
                );
            }

            const org = await prisma.organization.findUnique({
                where: { phoneNumber: vapiPhoneNumber },
                // Select only the fields needed to build the assistant config.
                // Fewer bytes over the wire = faster Neon HTTP response.
                select: {
                    id: true,
                    name: true,
                    openingLine: true,
                    qualificationQs: true,
                    voiceConfig: true,
                    subscriptionId: true,
                },
            });

            if (!org) {
                console.error(`No organization found for number: ${vapiPhoneNumber}`);
                return NextResponse.json({
                    assistant: {
                        firstMessage: "I'm sorry, this number is not configured correctly.",
                        model: {
                            provider: 'openai',
                            model: 'gpt-3.5-turbo',
                            messages: [
                                {
                                    role: 'system',
                                    content:
                                        'You are a system error assistant. Inform the caller that the number is not configured.',
                                },
                            ],
                        },
                    },
                });
            }

            const systemPrompt = `
[Identity]
You are a Senior ISA (Inside Sales Agent) for ${org.name.replace(/\s+/g, ' ')}, a high-end real estate agency.
You are not a receptionist — you are a consultative sales professional who genuinely helps property owners make smarter decisions.

[Goal]
Secure a "Free Professional Valuation" appointment. This is your only ask.
The valuation is free, carries zero commitment, and takes 10 minutes.
Frame it as intelligence — not a sales pitch.

[FSBO Hook — Use When Establishing Value]
When the caller is a FSBO owner (selling privately), use this hook naturally:
"I noticed you're selling privately — which is totally fine. We actually have a database of qualified buyers actively looking in your area. I'd love to book a quick 10-minute valuation so you can see if your asking price matches what our buyers are willing to pay. It's free, no strings attached."
Adapt the wording to the conversation. Never read it verbatim if it would sound robotic.

[Style]
- Speak fast, warm, and confident — like a top sales professional, not a script reader
- Use "um", "well", "so look" naturally
- MAX 1-2 sentences per response. Never monologue.
- Match the caller's language. Default: "en-US"
- Mirror their energy: if they're chatty, engage; if they're brief, be direct

[Priority System - Follow This Order]
P0 - STOP signals: If caller says "stop calling", "remove my number", "do not call" -> say "Understood — I'll take you off the list right away. Sorry for the inconvenience." -> call end_call(reason: "do_not_call", outcome: "removed")

P1 - Objections: Handle BEFORE continuing qualification
  - "I don't want to pay commission" -> "I completely understand. Honestly, our goal isn't to list your home today — it's just to show you the data. If we bring you a qualified buyer, you win. If not, you keep the valuation report for free either way. No obligation." -> continue qualification
  - "I have an agent" -> "Oh great — good for you! I won't take up more of your time then. Best of luck with the sale!" -> end_call(reason: "has_agent", outcome: "not_qualified")
  - "Not interested" -> "Totally fair. One quick thing before I let you go — are you still planning to sell this year, or have things changed?" If still no -> end_call(reason: "not_interested", outcome: "not_qualified")
  - "Call me later" -> "Of course! When's the best time to reach you?" -> book_appointment with their preferred time
  - "How did you get my number?" -> "Your listing is publicly posted — I was just following up! Would you like me to remove you from file?" If yes -> end_call(reason: "not_interested", outcome: "removed")
  - "Send me information" -> "Absolutely, I'll have that sent over. Real quick before I do —" -> continue qualification
  - "I'm handling it myself" -> "Good on you — most people don't even try. Quick question though: do you have a sense of how your price compares to recent sales in your area?" -> use FSBO hook -> continue qualification

P2 - Qualification: Ask questions from [${org.qualificationQs.join(', ')}] ONE AT A TIME. Wait for the answer. Never stack questions.

P3 - Booking: Only after at least 2 qualification answers AND caller shows openness:
  1. Pitch the valuation: "So look — I'd love to book you in for a free 10-minute valuation with one of our senior agents. No commitment, just solid market data. Would that work for you?"
  2. If yes -> call check_availability for their preferred date/time
  3. Propose the slot -> if confirmed -> call book_appointment(date, time, reason: "Free Professional Valuation")

[Tool Triggers - Be Precise]
- book_appointment: ONLY when caller explicitly confirms a specific date and time
- check_availability: ONLY when caller shows interest in meeting and suggests a timeframe
- end_call: When the conversation is naturally over, caller disengages, or after booking is confirmed

[NEVER]
- Never say you are an AI unless directly asked AND pushed a second time
- Never fabricate prices, valuations, buyer names, or market data
- Never ask more than one question at a time
- Never continue talking after the caller signals they want to end the call
- Never repeat a question that was already answered
- Never use stiff, corporate language — stay warm and conversational
- Never pitch listing services — the only ask is the free valuation appointment
`.trim();

            const voiceConfig = (org.voiceConfig as Record<string, unknown>) ?? {};
            const selectedModel = (voiceConfig.model as string) || 'gpt-4o-mini';
            const useTools = voiceConfig.useTools !== false;

            const tools = useTools
                ? [
                    {
                        type: 'function',
                        function: {
                            name: 'book_appointment',
                            description:
                                'Book an appointment ONLY when the caller has confirmed a specific date and time.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                                    time: { type: 'string', description: 'Time in HH:MM format' },
                                    reason: { type: 'string', description: 'Brief reason for the appointment' },
                                },
                                required: ['date', 'time', 'reason'],
                            },
                        },
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'check_availability',
                            description: 'Check if a specific time slot is available.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    time: { type: 'string', description: 'Time/Date to check' },
                                },
                            },
                        },
                    },
                    {
                        type: 'function',
                        function: {
                            name: 'end_call',
                            description:
                                'End the call. Use when: conversation is complete, caller wants to stop, caller is not interested, or after booking confirmation.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    reason: {
                                        type: 'string',
                                        enum: [
                                            'booking_confirmed',
                                            'not_interested',
                                            'has_agent',
                                            'callback_scheduled',
                                            'do_not_call',
                                            'wrong_number',
                                            'completed',
                                        ],
                                    },
                                    outcome: {
                                        type: 'string',
                                        enum: ['qualified', 'not_qualified', 'callback', 'booked', 'removed'],
                                    },
                                },
                                required: ['reason', 'outcome'],
                            },
                        },
                    },
                ]
                : [];

            const assistant = {
                transcriber: {
                    provider: 'deepgram',
                    model: 'nova-3',
                    language: 'en-US',
                    smart_format: true,
                },
                model: {
                    provider: 'openai',
                    model: selectedModel,
                    temperature: 0.3,
                    maxTokens: 150,
                    messages: [{ role: 'system', content: systemPrompt }],
                    tools,
                },
                voice: {
                    provider: '11labs',
                    voiceId: 'cjVigY5qzO86Huf0OWal',
                    model: 'eleven_turbo_v2_5',
                },
                startSpeakingPlan: {
                    waitSeconds: 0.4,
                    smartEndpointingPlan: { provider: 'livekit' },
                },
                stopSpeakingPlan: {
                    numWords: 0,
                    voiceSeconds: 0.2,
                    backoffSeconds: 1.0,
                },
                analysisPlan: {
                    structuredDataPlan: {
                        enabled: true,
                        schema: {
                            type: 'object',
                            properties: {
                                caller_intent: {
                                    type: 'string',
                                    enum: ['buy', 'sell', 'rent', 'info', 'complaint', 'other'],
                                },
                                qualified: { type: 'boolean' },
                                objection_type: {
                                    type: 'string',
                                    enum: ['none', 'has_agent', 'not_interested', 'timing', 'price', 'trust'],
                                },
                                appointment_booked: { type: 'boolean' },
                                follow_up_needed: { type: 'boolean' },
                                property_type_interest: {
                                    type: 'string',
                                    enum: ['apartment', 'house', 'commercial', 'land', 'unknown'],
                                },
                                language_used: { type: 'string', enum: ['en', 'fr', 'de', 'es'] },
                            },
                        },
                    },
                    successEvaluationPlan: {
                        enabled: true,
                        rubric: 'NumericScale',
                    },
                },
                firstMessage: org.openingLine,
                metadata: {
                    orgId: org.id,
                    subscriptionId: org.subscriptionId,
                    environment: 'production',
                    callType: 'inbound',
                },
            };

            return NextResponse.json({ assistant });
        }

        // ─── tool-calls ─────────────────────────────────────────────────────────
        // Pure computation — no DB access needed.
        if (body.message.type === 'tool-calls') {
            const { toolCalls } = body.message;

            const results = toolCalls.map((call: { id: string; function: { name: string; parameters: Record<string, string> } }) => {
                const { name, parameters } = call.function;
                let result = 'Action completed.';

                if (name === 'book_appointment') {
                    console.log(`[BOOKING] Date: ${parameters.date}, Time: ${parameters.time}, Reason: ${parameters.reason}`);
                    result = `Appointment booked for ${parameters.date} at ${parameters.time}. Requesting confirmation.`;
                } else if (name === 'check_availability') {
                    result = 'Yes, that time is available.';
                } else if (name === 'end_call') {
                    console.log(`[END_CALL] Reason: ${parameters.reason}, Outcome: ${parameters.outcome}`);
                    result = 'Call ended.';
                }

                return { toolCallId: call.id, result };
            });

            return NextResponse.json({ results });
        }

        // ─── end-of-call-report ─────────────────────────────────────────────────
        // Non-critical path — Vapi doesn't need a fast response here.
        // All DB writes and email fire concurrently via Promise.all.
        if (body.message.type === 'end-of-call-report') {
            const call = body.message.call;
            const analysis = body.message.analysis;
            const transcript = body.message.transcript as string | null;
            const summary = analysis?.summary as string | null;
            const structuredData = analysis?.structuredData as Record<string, unknown> | null;
            const recordingUrl = (body.message.recordingUrl || call?.recordingUrl) as string | null;
            const metadata = call?.assistant?.metadata || call?.metadata;
            const orgId = metadata?.orgId as string | undefined;
            const leadId = metadata?.leadId as string | undefined;

            if (orgId) {
                try {
                    // ── Lead Status Derivation ───────────────────────────────────────
                    // Maps Vapi's structuredData analysis back to a ConversationState.
                    // Rules (in priority order):
                    //   1. appointment_booked: true           → QUALIFIED
                    //   2. caller_intent / objection signals  → DISQUALIFIED
                    //   3. Call too short (<10s, no answer)   → ATTEMPTED
                    //   4. Real conversation, no booking      → CONTACTED
                    const durationSeconds = Math.round(call.durationSeconds || 0);

                    const derivedLeadStatus = (() => {
                        // Rule 1: Appointment booked — best possible outcome
                        if (structuredData?.appointment_booked === true) return 'QUALIFIED';

                        // Rule 2: Lead is not interested or definitively disqualified
                        const intent = structuredData?.caller_intent as string | undefined;
                        const objection = structuredData?.objection_type as string | undefined;
                        const followUp = structuredData?.follow_up_needed;
                        if (
                            intent === 'not_interested' ||
                            objection === 'not_interested' ||
                            objection === 'has_agent' ||
                            followUp === false && structuredData?.qualified === false
                        ) return 'DISQUALIFIED';

                        // Rule 3: Very short call — probably voicemail or no answer
                        if (durationSeconds < 10) return 'ATTEMPTED';

                        // Rule 4: Real conversation, no booking yet
                        return 'CONTACTED';
                    })();

                    // Derive a compact outcome string for the CallLog record.
                    const derivedOutcome = (() => {
                        if (!structuredData) return null;
                        if (structuredData.appointment_booked === true) return 'booked';
                        if (structuredData.qualified === true) return 'qualified';
                        const objection = structuredData.objection_type as string;
                        if (objection === 'has_agent') return 'has_agent';
                        if (objection === 'not_interested') return 'not_interested';
                        return 'contacted';
                    })();

                    // Fire all independent DB operations concurrently.
                    const dbOps: Promise<unknown>[] = [
                        prisma.callLog.create({
                            data: {
                                orgId,
                                leadId: leadId ?? null,
                                status: call.status || 'completed',
                                outcome: derivedOutcome,
                                duration: Math.round(call.durationSeconds || 0),
                                summary: summary || 'No summary available',
                                transcript: transcript || 'No transcript available',
                                recordingUrl,
                            },
                        }),
                        prisma.organization.findUnique({
                            where: { id: orgId },
                            select: { email: true, name: true },
                        }),
                    ];

                    // Update the specific lead's status only if a leadId was passed in metadata.
                    // Outbound calls always include leadId. Inbound calls do not (no lead lookup on inbound).
                    if (leadId) {
                        dbOps.push(
                            prisma.lead.update({
                                where: { id: leadId },
                                data: {
                                    status: derivedLeadStatus,
                                    lastCall: new Date(),
                                },
                            })
                        );
                    }

                    const results = await Promise.all(dbOps);
                    const org = results[1] as { email: string; name: string } | null;

                    if (org?.email) {
                        await resend.emails.send({
                            from: 'Thavon <updates@thavon.com>',
                            to: org.email,
                            subject: `New Call Summary - ${new Date().toLocaleDateString()}`,
                            html: `
                                <h1>Call Summary</h1>
                                <p><strong>Status:</strong> ${call.status}</p>
                                <p><strong>Duration:</strong> ${Math.round(call.durationSeconds || 0)}s</p>
                                <p><strong>Lead Status:</strong> ${leadId ? derivedLeadStatus : 'N/A (inbound)'}</p>
                                <p><strong>Summary:</strong> ${summary || 'N/A'}</p>
                                <p><a href="${recordingUrl}">Listen to Recording</a></p>
                                <br/>
                                <h2>Transcript</h2>
                                <p style="white-space: pre-wrap;">${transcript || 'N/A'}</p>
                            `,
                        });
                    }
                } catch (error) {
                    // Log but don't fail the response — Vapi doesn't retry on 500 for this event.
                    console.error('Error processing end-of-call:', error);
                }
            }

            return NextResponse.json({ status: 'ok' });
        }


        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Error processing Vapi webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
