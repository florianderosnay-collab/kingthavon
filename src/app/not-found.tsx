export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: 0 }}>404</h1>
                <p style={{ color: '#888', marginTop: '0.5rem' }}>Page not found.</p>
                <a href="/dashboard" style={{ marginTop: '1rem', display: 'inline-block', fontSize: '0.875rem', textDecoration: 'underline' }}>
                    Back to Dashboard
                </a>
            </div>
        </div>
    );
}
