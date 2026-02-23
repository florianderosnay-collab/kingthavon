import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma"
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
        where: { clerkUserId: userId },
    });

    if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const leads = await prisma.lead.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ leads });
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
        where: { clerkUserId: userId },
    });

    if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    try {
        const body = await req.json();
        const { leads } = body; // Expecting array of { name, phone, address }

        if (!Array.isArray(leads)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const createdLeads = await prisma.$transaction(
            leads.map((lead: any) =>
                prisma.lead.create({
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

        return NextResponse.json({ count: createdLeads.length });
    } catch (error) {
        console.error('Error creating leads:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
