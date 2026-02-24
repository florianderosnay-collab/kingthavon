import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('Stripe-Signature') ?? '';

    let event: Stripe.Event;

    try {
        // constructEventAsync uses Web Crypto API — compatible with Edge Runtime
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return new NextResponse(`Webhook Error: ${msg}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        if (!session?.metadata?.userId) {
            return new NextResponse('User id is required', { status: 400 });
        }

        await prisma.organization.updateMany({
            where: { clerkUserId: session.metadata.userId },
            data: {
                stripeCustomerId: subscription.customer as string,
                subscriptionId: subscription.id,
                plan: 'growth',
            },
        });
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.organization.updateMany({
            where: { stripeCustomerId: subscription.customer as string },
            data: {
                subscriptionId: null,
                plan: 'core',
            },
        });
    }

    return new NextResponse(null, { status: 200 });
}
