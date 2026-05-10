import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    // ── Guard: webhook secret must be configured ─────────────────────────────
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('[STRIPE_WEBHOOK] STRIPE_WEBHOOK_SECRET is not configured');
        return new NextResponse('Server configuration error', { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get('Stripe-Signature') ?? '';

    let event: Stripe.Event;

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret
        );
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[STRIPE_WEBHOOK] Signature verification failed:', msg);
        return new NextResponse('Webhook signature verification failed', { status: 400 });
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
