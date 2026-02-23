import { PrismaNeonHttp } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

// PrismaNeonHttp is the pure-HTTP adapter — no WebSockets, no TCP pool.
// All queries go over HTTPS fetch, making it fully Edge Runtime compatible.
// Each request gets a fresh HTTP connection: ideal for stateless edge functions.
const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {
    arrayMode: false,
    fullResults: true,
})

export const prismaEdge = new PrismaClient({ adapter })
