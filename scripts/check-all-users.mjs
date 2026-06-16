import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const users = await prisma.user.findMany({
  select: { id: true, email: true, firstName: true, lastName: true, role: true, emailVerified: true, status: true }
})
console.log(`Total users: ${users.length}`)
console.log(JSON.stringify(users.slice(0, 10), null, 2))
await prisma.$disconnect()
