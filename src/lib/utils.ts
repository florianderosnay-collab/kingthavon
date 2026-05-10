import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string) {
  if (typeof window !== 'undefined') return path

  // Railway / production: use configured app URL
  if (process.env.NEXT_PUBLIC_APP_URL)
    return `${process.env.NEXT_PUBLIC_APP_URL}${path}`

  // Railway auto-injected domain
  if (process.env.RAILWAY_PUBLIC_DOMAIN)
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}${path}`

  // Legacy Vercel support
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL}${path}`

  return `http://localhost:3000${path}`
}
