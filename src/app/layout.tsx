import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

// Opt out of static generation — the app is auth-gated and every
// page renders dynamically. This also prevents Clerk from erroring
// at build time when no publishable key is present locally.
export const dynamic = 'force-dynamic';


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Thavon - AI Voice Receptionist",
  description: "Automated real estate calling platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
