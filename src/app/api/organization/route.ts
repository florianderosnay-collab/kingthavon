import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// ── Safe fields exposed to the client ────────────────────────────────────────
const ORG_SAFE_SELECT = {
    name: true,
    email: true,
    openingLine: true,
    qualificationQs: true,
    voiceConfig: true,
    phoneNumber: true,
    plan: true,
} as const;

export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const org = await prisma.organization.findUnique({
        where: { clerkUserId: userId },
        select: ORG_SAFE_SELECT,
    });

    return NextResponse.json({ org });
}

// ── Allowlisted fields for PUT ───────────────────────────────────────────────
// Only these fields can be updated by the user. Anything else is silently dropped.
const ALLOWED_UPDATE_FIELDS = ['name', 'email', 'openingLine', 'qualificationQs', 'voiceConfig'] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;
const MAX_OPENING_LINE_LENGTH = 500;

export async function PUT(request: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();

        // Build update payload from allowlisted fields only
        const data: Record<string, unknown> = {};
        for (const field of ALLOWED_UPDATE_FIELDS) {
            if (body[field] !== undefined) {
                data[field] = body[field];
            }
        }

        // ── Validation ───────────────────────────────────────────────────────
        if (typeof data.name === 'string') {
            const trimmed = (data.name as string).trim();
            if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) {
                return NextResponse.json(
                    { error: `Name must be 1-${MAX_NAME_LENGTH} characters` },
                    { status: 400 }
                );
            }
            data.name = trimmed;
        }

        if (typeof data.email === 'string') {
            const trimmed = (data.email as string).trim().toLowerCase();
            if (!EMAIL_REGEX.test(trimmed)) {
                return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
            }
            data.email = trimmed;
        }

        if (typeof data.openingLine === 'string') {
            const trimmed = (data.openingLine as string).trim();
            if (trimmed.length > MAX_OPENING_LINE_LENGTH) {
                return NextResponse.json(
                    { error: `Opening line must be under ${MAX_OPENING_LINE_LENGTH} characters` },
                    { status: 400 }
                );
            }
            data.openingLine = trimmed;
        }

        if (data.qualificationQs !== undefined) {
            if (!Array.isArray(data.qualificationQs) || !data.qualificationQs.every((q: unknown) => typeof q === 'string')) {
                return NextResponse.json({ error: 'qualificationQs must be an array of strings' }, { status: 400 });
            }
            if (data.qualificationQs.length > 20) {
                return NextResponse.json({ error: 'Maximum 20 qualification questions' }, { status: 400 });
            }
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const org = await prisma.organization.update({
            where: { clerkUserId: userId },
            data,
            select: ORG_SAFE_SELECT,
        });

        return NextResponse.json({ org });
    } catch (error) {
        console.error('[ORG_UPDATE_ERROR]', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
