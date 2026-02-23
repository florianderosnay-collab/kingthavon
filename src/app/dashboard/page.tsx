export const runtime = 'edge';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prismaEdge } from '@/lib/prisma-edge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Calendar, Users, BarChart3 } from 'lucide-react';
import { TestCallDialog } from '@/components/test-call-dialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function outcomeLabel(outcome: string | null, status: string): string {
    if (outcome === 'booked') return 'Appointment Booked';
    if (outcome === 'qualified') return 'Qualified';
    if (outcome === 'has_agent') return 'Has Agent';
    if (outcome === 'not_interested') return 'Not Interested';
    if (status === 'completed') return 'Completed';
    return status ?? 'Unknown';
}

function outcomeColor(outcome: string | null): string {
    if (outcome === 'booked' || outcome === 'qualified') return 'bg-green-100';
    if (outcome === 'has_agent' || outcome === 'not_interested') return 'bg-gray-100';
    return 'bg-blue-100';
}

function outcomeTextColor(outcome: string | null): string {
    if (outcome === 'booked' || outcome === 'qualified') return 'text-green-600';
    if (outcome === 'has_agent' || outcome === 'not_interested') return 'text-gray-500';
    return 'text-blue-500';
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');

    // Step 1: get the org (fast single-field lookup)
    const org = await prismaEdge.organization.findUnique({
        where: { clerkUserId: userId },
        select: { id: true, phoneNumber: true, plan: true },
    });

    // Step 2: fire all metric queries concurrently — single round-trip per query,
    // all running in parallel over the Neon HTTP adapter.
    const [
        totalCalls,
        qualifiedLeads,
        appointments,
        contactedLeads,
        recentCalls,
    ] = org
            ? await Promise.all([
                // Total calls handled by this org
                prismaEdge.callLog.count({
                    where: { orgId: org.id },
                }),
                // Leads that reached QUALIFIED state (valuation booked)
                prismaEdge.lead.count({
                    where: { orgId: org.id, status: 'QUALIFIED' },
                }),
                // CallLog rows where the AI confirmed a booking
                prismaEdge.callLog.count({
                    where: { orgId: org.id, outcome: 'booked' },
                }),
                // Denominator for conversion rate: everyone we actually spoke to
                prismaEdge.lead.count({
                    where: {
                        orgId: org.id,
                        status: { in: ['CONTACTED', 'QUALIFYING', 'QUALIFIED', 'DISQUALIFIED'] },
                    },
                }),
                // Last 5 calls for the activity feed
                prismaEdge.callLog.findMany({
                    where: { orgId: org.id },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        status: true,
                        outcome: true,
                        duration: true,
                        summary: true,
                        createdAt: true,
                    },
                }),
            ])
            : [0, 0, 0, 0, []];

    const conversionRate =
        contactedLeads > 0
            ? Math.round((qualifiedLeads / contactedLeads) * 100)
            : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                    <p className="text-muted-foreground mt-1">
                        Real-time performance of your AI Mandate Hunter.
                    </p>
                </div>
                <div className="flex gap-2">
                    <TestCallDialog />
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCalls}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{qualifiedLeads}</div>
                        <p className="text-xs text-muted-foreground">Valuation appointments booked</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointments}</div>
                        <p className="text-xs text-muted-foreground">Confirmed by AI</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{conversionRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            Qualified / Contacted ({contactedLeads} total)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity & System Status */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(recentCalls as Array<{
                            id: string;
                            status: string;
                            outcome: string | null;
                            duration: number | null;
                            summary: string | null;
                            createdAt: Date;
                        }>).length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No calls yet. Your AI is ready.
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {(recentCalls as Array<{
                                    id: string;
                                    status: string;
                                    outcome: string | null;
                                    duration: number | null;
                                    summary: string | null;
                                    createdAt: Date;
                                }>).map((call) => (
                                    <div key={call.id} className="flex items-start gap-4">
                                        <div className={`h-9 w-9 rounded-full ${outcomeColor(call.outcome)} flex items-center justify-center shrink-0`}>
                                            <Phone className={`h-4 w-4 ${outcomeTextColor(call.outcome)}`} />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <p className="text-sm font-medium leading-none">
                                                {outcomeLabel(call.outcome, call.status)}
                                                {call.duration ? (
                                                    <span className="text-muted-foreground font-normal ml-2 text-xs">
                                                        {formatDuration(call.duration)}
                                                    </span>
                                                ) : null}
                                            </p>
                                            {call.summary && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {call.summary}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground shrink-0">
                                            {timeAgo(new Date(call.createdAt))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>System Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Phone Number</p>
                                    <p className="text-sm text-muted-foreground">
                                        {org?.phoneNumber ?? '—'}
                                    </p>
                                </div>
                                <div className={`h-2 w-2 rounded-full ${org ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Subscription</p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {org?.plan ?? 'core'} Plan
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <a href="/dashboard/settings">Manage</a>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
