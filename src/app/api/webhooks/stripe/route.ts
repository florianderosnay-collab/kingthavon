import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get("Stripe-Signature") as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        )

        if (!session?.metadata?.userId) {
            return new NextResponse("User id is required", { status: 400 })
        }

        await prisma.organization.updateMany({
            where: {
                clerkUserId: session.metadata.userId,
            },
            data: {
                stripeCustomerId: subscription.customer as string,
                subscriptionId: subscription.id,
                plan: "growth", // Assuming this is the only paid plan for now or extracting from priceId
                // In a real app we'd map priceId to plan name
            },
        })
    }

    if (event.type === "invoice.payment_succeeded") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        )

        // Verify ownership? Usually we trust customerId
        // If we needed to update "validUntil" date we would do it here

        // For now we just log it or update status if we had a status field
    }

    return new NextResponse(null, { status: 200 })
}
