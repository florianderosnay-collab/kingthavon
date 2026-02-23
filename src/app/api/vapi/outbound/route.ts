export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { prismaEdge } from '@/lib/prisma-edge';
import { auth } from '@clerk/nextjs/server';

const VAPI_API_URL = 'https://api.vapi.ai/call/phone';

// ─── Shared assistant builder ──────────────────────────────────────────────────
// Mirrors the inbound route logic so outbound calls share the exact same
// voice stack, tools, and analytics schema. Only the system prompt and
// firstMessage differ to reflect the outbound FSBO context.
function buildAssistant(
    org: {
        id: string;
        name: string;
        openingLine: string;
        qualificationQs: string[];
        voiceConfig: unknown;
        subscriptionId: string | null;
    },
    lead: {
        id: string;
        name: string;
        phone: string;
        address: string | null;
    }
) {
    const voiceConfig = (org.voiceConfig as Record<string, unknown>) ?? {};
    const selectedModel = (voiceConfig.model as string) || 'gpt-4o-mini';
    const useTools = voiceConfig.useTools !== false;

    const addressLine = lead.address ? ` at ${lead.address}` : '';

    const systemPrompt = `
[Identity]
You are ${org.name.replace(/\s+/g, ' ')}'s AI real estate agent making an outbound call.
You are calling ${lead.name}${addressLine}. They have a property listed for sale (FSBO).

[Style]
- Speak fast, casual, friendly — like a real person, not a script reader
- Use "um", "well", "so" naturally
- MAX 1-2 sentences per response. Never monologue.
- Match the caller's language. Default: "en-US"

[Goal]
Introduce yourself, qualify the lead, and book an appointment for one of our agents to discuss their property.

[Priority System - Follow This Order]
P0 - STOP signals: If they say "stop calling", "remove my number", "do not call" -> say "Understood, I'll remove you from our list right away. Sorry for the interruption." -> call end_call(reason: "do_not_call", outcome: "removed")

P1 - Objections: Handle BEFORE continuing qualification
  - "I already have an agent" -> "Oh great! No worries, I'll let you go. Best of luck with the sale!" -> end_call(reason: "has_agent", outcome: "not_qualified")
  - "Not interested" -> "Totally understand. Just one quick question before I go — are you still planning to sell, or have your plans changed?" If still no -> end_call(reason: "not_interested", outcome: "not_qualified")
  - "Call me later" -> "Of course! When's a better time for you?" -> book_appointment with their preferred time
  - "How did you get my number?" -> "Your listing is publicly posted — I'm just following up! Want me to remove you from our list?" If yes -> end_call(reason: "not_interested", outcome: "removed")
  - "Send me information" -> "Absolutely, I'll have the team send that over. Quick question first:" -> continue qualification
  - "I'm handling it myself" -> "Totally respect that! Our agents work alongside sellers too, not instead of them. Mind if I ask a couple of questions?" -> continue qualification

P2 - Qualification: Ask questions from [${org.qualificationQs.join(', ')}] ONE AT A TIME. Wait for each answer. Never stack questions.

P3 - Booking: Only after at least 2 qualification questions answered AND caller shows interest:
  1. "Would you be open to a quick chat with one of our agents — no pressure, just to explore your options?"
  2. If yes -> call check_availability for their preferred date/time
  3. Propose a slot -> if confirmed -> call book_appointment(date, time, reason)

[Tool Triggers - Be Precise]
- book_appointment: ONLY when the lead explicitly confirms a specific date and time
- check_availability: ONLY when the lead expresses interest in meeting and suggests a timeframe
- end_call: When conversation is complete, lead wants to stop, or after booking confirmation

[NEVER]
- Never say you are an AI unless directly asked AND pressed twice
- Never make up property prices, valuations, or availability
- Never ask more than one question at a time
- Never keep talking after they want to hang up
- Never repeat a question already answered
- Never use formal/corporate language — stay casual and human
`.trim();

    const tools = useTools
        ? [
            {
                type: 'function',
                function: {
                    name: 'book_appointment',
                    description:
                        'Book an appointment ONLY when the lead has confirmed a specific date and time.',
                    parameters: {
                        type: 'object',
                        properties: {
                            date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                            time: { type: 'string', description: 'Time in HH:MM format' },
                            reason: {
                                type: 'string',
                                description: 'Brief reason for the appointment',
                            },
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
                        'End the call when: conversation is complete, lead wants to stop, or after booking confirmation.',
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

    return {
        // Outbound-specific greeting: use lead's first name and reference their listing
        firstMessage: `Hi, is this ${lead.name.split(' ')[0]}? This is ${org.name} calling about your property listing${addressLine}. Do you have a quick second?`,
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
        metadata: {
            orgId: org.id,
            leadId: lead.id,
            leadPhone: lead.phone,
            subscriptionId: org.subscriptionId,
            environment: 'production',
            callType: 'outbound',
        },
    };
}

// ─── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { leadId?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { leadId } = body;
    if (!leadId) {
        return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    // Fetch org and lead concurrently
    const [org, lead] = await Promise.all([
        prismaEdge.organization.findUnique({
            where: { clerkUserId: userId },
            select: {
                id: true,
                name: true,
                openingLine: true,
                qualificationQs: true,
                voiceConfig: true,
                vapiPhoneNumberId: true,
                subscriptionId: true,
            },
        }),
        prismaEdge.lead.findUnique({
            where: { id: leadId },
            select: {
                id: true,
                orgId: true,
                name: true,
                phone: true,
                address: true,
            },
        }),
    ]);

    if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    if (!lead || lead.orgId !== org.id) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    if (!org.vapiPhoneNumberId) {
        return NextResponse.json(
            { error: 'No Vapi phone number ID configured. Set vapiPhoneNumberId in your organization settings.' },
            { status: 400 }
        );
    }
    if (!process.env.VAPI_API_KEY) {
        return NextResponse.json({ error: 'VAPI_API_KEY is not configured' }, { status: 500 });
    }

    const assistant = buildAssistant(org, lead);

    // POST to Vapi's outbound call API — no assistantId, full inline assistant config
    const vapiPayload = {
        phoneNumberId: org.vapiPhoneNumberId,
        customer: {
            number: lead.phone,
            name: lead.name,
        },
        assistant,
    };

    const vapiRes = await fetch(VAPI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        },
        body: JSON.stringify(vapiPayload),
    });

    if (!vapiRes.ok) {
        const errText = await vapiRes.text();
        console.error(`[Vapi outbound] ${vapiRes.status}: ${errText}`);
        return NextResponse.json(
            { error: `Vapi API error: ${vapiRes.status}`, detail: errText },
            { status: 502 }
        );
    }

    const vapiData = await vapiRes.json();

    // Update lead status to 'ATTEMPTED' only after Vapi confirms the call was created
    await prismaEdge.lead.update({
        where: { id: leadId },
        data: {
            status: 'ATTEMPTED',
            lastCall: new Date(),
        },
    });

    return NextResponse.json({
        success: true,
        callId: vapiData.id,
        message: `Outbound call initiated to ${lead.name}`,
    });
}
