"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Phone,
    FileText,
    Settings,
    LogOut,
    Users
} from "lucide-react"
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

const routes = [
    {
        label: "Overview",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Calls",
        icon: Phone,
        href: "/dashboard/calls",
        color: "text-violet-500",
    },
    {
        label: "Script",
        icon: FileText,
        href: "/dashboard/script", // We might want to move script editor to its own page or keep in modal
        color: "text-pink-700",
    },
    {
        label: "Leads",
        icon: Users,
        href: "/dashboard/leads",
        color: "text-amber-500",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/dashboard/settings",
        color: "text-gray-500",
    },
]

export function DashboardSidebar() {
    const pathname = usePathname()

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        {/* Logo placeholder - replace with Image if you have one */}
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold text-xl">
                            Th
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">
                        Thavon
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3 py-2">
                <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-x-2">
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                            <div className="text-xs text-zinc-400">
                                <p className="font-medium text-white">My Account</p>
                                <p>Manage Subscription</p>
                            </div>
                        </SignedIn>
                        <SignedOut>
                            <Button variant="secondary" className="w-full" size="sm" asChild>
                                <a href="/sign-in">Sign In</a>
                            </Button>
                        </SignedOut>
                    </div>
                </div>
            </div>
        </div>
    )
}
