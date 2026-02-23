export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { prismaEdge } from '@/lib/prisma-edge';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const org = await prismaEdge.organization.findUnique({
        where: { clerkUserId: userId },
        select: { id: true },
    });

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const leads = await prismaEdge.lead.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ leads });
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const org = await prismaEdge.organization.findUnique({
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

        // Insert leads sequentially — $transaction is not available on the HTTP Neon driver
        const results = await Promise.all(
            leads.map((lead: { name?: string; phone: string; address?: string }) =>
                prismaEdge.lead.create({
                    data: {
                        orgId: org.id,
                        name: lead.name || 'Unknown',
                        phone: lead.phone,
                        address: lead.address || null,
                        status: 'NEW',
                    },
                })
            )
        );

        return NextResponse.json({ count: results.length });
    } catch (error) {
        console.error('Error creating leads:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
