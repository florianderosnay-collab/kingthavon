import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { absoluteUrl } from '@/lib/utils';

const settingsUrl = absoluteUrl('/dashboard/settings');

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const org = await prisma.organization.findFirst({
            where: { clerkUserId: userId },
        });

        if (!org) {
            return new NextResponse('Organization not found', { status: 404 });
        }

        if (!org.stripeCustomerId) {
            return new NextResponse('No active subscription', { status: 400 });
        }

        const stripeSession = await stripe.billingPortal.sessions.create({
            customer: org.stripeCustomerId,
            return_url: settingsUrl,
        });

        return NextResponse.json({ url: stripeSession.url });
    } catch (error) {
        console.error('[STRIPE_PORTAL_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
