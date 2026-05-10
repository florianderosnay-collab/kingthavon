import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// ── Phone validation ─────────────────────────────────────────────────────────
const PHONE_E164_REGEX = /^\+[1-9]\d{6,14}$/;

function sanitizePhone(raw: string): string {
    // Strip common formatting chars but keep leading +
    return raw.replace(/[\s\-()]/g, '');
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { phoneNumber?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { phoneNumber: rawPhone } = body;
    if (!rawPhone || typeof rawPhone !== 'string') {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const phoneNumber = sanitizePhone(rawPhone);
    if (!PHONE_E164_REGEX.test(phoneNumber)) {
        return NextResponse.json(
            { error: 'Invalid phone number format. Use E.164 format (e.g. +1234567890)' },
            { status: 400 }
        );
    }

    const org = await prisma.organization.findUnique({
        where: { clerkUserId: userId },
    });

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    if (!process.env.VAPI_API_KEY) {
        return NextResponse.json({ error: 'VAPI_API_KEY is not configured' }, { status: 500 });
    }

    try {
        const systemPrompt = `
You are a Senior ISA (Inside Sales Agent) for ${org.name}, a high-end real estate agency.
Your goal is to book a Free Professional Valuation appointment.

Opening Line: "${org.openingLine}"

Qualification Questions (ask one at a time):
${org.qualificationQs.map((q: string) => `- ${q}`).join('\n')}

If the user asks to speak to a human, say you will have someone call them back.
        `.trim();

        const vapiRes = await fetch('https://api.vapi.ai/call', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumberId: org.vapiPhoneNumberId || process.env.VAPI_PHONE_NUMBER_ID,
                assistant: {
                    model: {
                        provider: 'openai',
                        model: 'gpt-4o-mini',
                        temperature: 0.3,
                        messages: [{ role: 'system', content: systemPrompt }],
                    },
                    voice: {
                        provider: '11labs',
                        voiceId: 'cjVigY5qzO86Huf0OWal',
                        model: 'eleven_turbo_v2_5',
                    },
                    firstMessage: org.openingLine,
                    metadata: {
                        orgId: org.id,
                        environment: 'test',
                        callType: 'outbound-test',
                    },
                },
                customer: { number: phoneNumber },
            }),
        });

        if (!vapiRes.ok) {
            const text = await vapiRes.text();
            console.error('[VAPI_TEST_CALL_ERROR]', text);
            return NextResponse.json({ error: 'Failed to start call' }, { status: 502 });
        }

        const data = await vapiRes.json();
        return NextResponse.json({ success: true, callId: data.id });
    } catch (error) {
        console.error('[TEST_CALL_ERROR]', error);
        return NextResponse.json({ error: 'Failed to trigger call' }, { status: 500 });
    }
}
