import Stripe from 'stripe';

// Lazy Stripe initialization — prevents crash if STRIPE_SECRET_KEY is missing
// during build. Throws a clear error at runtime if accessed without the key.

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
    if (_stripe) return _stripe;

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error(
            '[stripe] STRIPE_SECRET_KEY is not set. ' +
            'Add it to your environment variables.'
        );
    }

    _stripe = new Stripe(key, {
        // @ts-expect-error — Stripe SDK types lag behind API versions
        apiVersion: '2025-01-27.acacia',
        typescript: true,
    });

    return _stripe;
}

// Proxy that defers Stripe instantiation to first access (same pattern as Prisma)
export const stripe = new Proxy({} as Stripe, {
    get(_target, prop: string | symbol) {
        return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
