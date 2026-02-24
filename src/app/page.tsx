import { redirect } from 'next/navigation';

// Root path redirects to /dashboard.
// This is a real estate AI app — the home is the dashboard.
// Pure Edge redirect, no DB, no async, no deps that can crash.
export default function Home() {
  redirect('/dashboard');
}
