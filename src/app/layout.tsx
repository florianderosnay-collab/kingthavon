export const runtime = 'edge';

import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Thavon - AI Voice Receptionist',
  description: 'Automated real estate calling platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    return (
      <ClerkProvider>
        <html lang="en">
          {/* Inter loaded via Google Fonts link — avoids next/font/google
                        which uses Node.js fs/crypto internally and crashes on CF Workers */}
          <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
              rel="stylesheet"
            />
          </head>
          <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {children}
          </body>
        </html>
      </ClerkProvider>
    );
  } catch (err) {
    console.error('[RootLayout] Runtime error:', err);
    return (
      <html lang="en">
        <body>
          <p style={{ padding: '2rem', color: 'red' }}>
            Application error. Check Cloudflare Pages logs.
          </p>
        </body>
      </html>
    );
  }
}
