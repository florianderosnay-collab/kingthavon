import { prisma } from '@/lib/prisma-edge'

// Call Duration limits per plan (in seconds)
export const PLAN_LIMITS = {
    core: 500 * 60,   // 500 mins
    growth: 2000 * 60, // 2000 mins
    agency_os: Infinity
}

export async function getMonthlyUsage(orgId: string) {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const usage = await prisma.callLog.aggregate({
        where: {
            orgId,
            createdAt: {
                gte: firstDayOfMonth,
                lte: lastDayOfMonth
            },
            status: 'completed', // Only count completed calls? Or all calls with duration?
            // Let's count all calls that have duration > 0
            duration: {
                gt: 0
            }
        },
        _sum: {
            duration: true
        }
    })

    return usage._sum.duration || 0
}

export async function checkUsageLimit(orgId: string) {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { plan: true }
    })

    if (!org) return false

    const usage = await getMonthlyUsage(orgId)
    const limit = PLAN_LIMITS[org.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.core

    return usage < limit
}
