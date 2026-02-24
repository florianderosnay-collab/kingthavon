import Stripe from 'stripe';

// Use a dummy key if missing to prevent crash on import in Dev/Mock mode
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_12345';

export const stripe = new Stripe(stripeKey, {
    // @ts-expect-error — Stripe SDK types lag behind API versions
    apiVersion: '2025-01-27.acacia',
    typescript: true,
});
