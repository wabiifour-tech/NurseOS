import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const users = await prisma.user.findMany({
  where: { role: 'SUPER_ADMIN' },
  select: { id: true, email: true, firstName: true, lastName: true, role: true, emailVerified: true, status: true }
})
console.log(JSON.stringify(users, null, 2))
await prisma.$disconnect()
