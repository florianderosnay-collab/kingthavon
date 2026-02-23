export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { prismaEdge } from '@/lib/prisma-edge';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const org = await prismaEdge.organization.findUnique({
        where: { clerkUserId: userId },
    });

    return NextResponse.json({ org });
}

export async function PUT(request: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { openingLine, qualificationQs, name, email, voiceConfig } = body;

        const org = await prismaEdge.organization.update({
            where: { clerkUserId: userId },
            data: {
                openingLine,
                qualificationQs,
                name,
                email,
                voiceConfig: voiceConfig ?? undefined,
            },
        });

        return NextResponse.json({ org });
    } catch (error) {
        console.error('Error updating organization:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
