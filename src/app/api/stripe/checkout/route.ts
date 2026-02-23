export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { prismaEdge } from '@/lib/prisma-edge';
import { absoluteUrl } from '@/lib/utils';

const settingsUrl = absoluteUrl('/dashboard/settings');

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const org = await prismaEdge.organization.findFirst({
            where: { clerkUserId: userId },
        });

        if (!org) return new NextResponse('Organization not found', { status: 404 });

        if (org.stripeCustomerId && org.subscriptionId && org.plan !== 'core') {
            return new NextResponse('Already subscribed', { status: 400 });
        }

        const stripeSession = await stripe.checkout.sessions.create({
            success_url: settingsUrl,
            cancel_url: settingsUrl,
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'auto',
            customer_email: user.emailAddresses[0].emailAddress,
            line_items: [
                {
                    price_data: {
                        currency: 'USD',
                        product_data: {
                            name: 'Thavon Growth Plan',
                            description: '2000 minutes/month',
                        },
                        unit_amount: 19900,
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            metadata: { userId },
        });

        return NextResponse.json({ url: stripeSession.url });
    } catch (error) {
        console.error('[STRIPE_CHECKOUT_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
