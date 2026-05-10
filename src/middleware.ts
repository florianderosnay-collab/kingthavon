import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require Clerk authentication
const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/api/organization(.*)",
    "/api/calls(.*)",
    "/api/leads(.*)",
    "/api/stripe/checkout(.*)",
    "/api/stripe/portal(.*)",
    "/api/vapi/outbound(.*)",
]);

// Public routes — webhooks use their own verification (Stripe signature, Vapi secret)
// Sign-in/sign-up are public by default in Clerk

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
