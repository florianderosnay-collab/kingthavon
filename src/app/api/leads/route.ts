import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// ── Validation constants ─────────────────────────────────────────────────────
const MAX_BATCH_SIZE = 500;
const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 200;
const PHONE_E164_REGEX = /^\+[1-9]\d{6,14}$/;

export async function GET(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const org = await prisma.organization.findUnique({
        where: { clerkUserId: userId },
        select: { id: true },
    });

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const leads = await prisma.lead.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ leads });
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const org = await prisma.organization.findUnique({
        where: { clerkUserId: userId },
        select: { id: true },
    });

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    try {
        const body = await req.json();
        const { leads } = body;

        if (!Array.isArray(leads)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // ── Batch size limit — prevent DB abuse / DoS ────────────────────────
        if (leads.length === 0) {
            return NextResponse.json({ error: 'No leads provided' }, { status: 400 });
        }
        if (leads.length > MAX_BATCH_SIZE) {
            return NextResponse.json(
                { error: `Maximum ${MAX_BATCH_SIZE} leads per upload` },
                { status: 400 }
            );
        }

        // ── Validate and sanitize each lead ──────────────────────────────────
        const errors: string[] = [];
        const sanitizedLeads = leads.map((lead: { name?: string; phone: string; address?: string }, i: number) => {
            // Phone: must be E.164 format
            const phone = typeof lead.phone === 'string' ? lead.phone.replace(/[\s\-()]/g, '') : '';
            if (!PHONE_E164_REGEX.test(phone)) {
                errors.push(`Lead ${i + 1}: invalid phone "${lead.phone}" (must be E.164 format, e.g. +1234567890)`);
            }

            // Name: trim and cap length
            const name = typeof lead.name === 'string'
                ? lead.name.trim().slice(0, MAX_NAME_LENGTH)
                : 'Unknown';

            // Address: trim and cap length
            const address = typeof lead.address === 'string'
                ? lead.address.trim().slice(0, MAX_ADDRESS_LENGTH) || null
                : null;

            return { name, phone, address };
        });

        if (errors.length > 0) {
            return NextResponse.json(
                { error: 'Validation failed', details: errors.slice(0, 10) },
                { status: 400 }
            );
        }

        const results = await Promise.all(
            sanitizedLeads.map((lead) =>
                prisma.lead.create({
                    data: {
                        orgId: org.id,
                        name: lead.name,
                        phone: lead.phone,
                        address: lead.address,
                        status: 'NEW',
                    },
                })
            )
        );

        return NextResponse.json({ count: results.length });
    } catch (error) {
        console.error('[LEADS_CREATE_ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
