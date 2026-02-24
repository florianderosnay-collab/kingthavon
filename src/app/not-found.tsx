export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold">404</h1>
                <p className="mt-2 text-muted-foreground">Page not found.</p>
                <a href="/dashboard" className="mt-4 inline-block text-sm underline">
                    Back to Dashboard
                </a>
            </div>
        </div>
    );
}
