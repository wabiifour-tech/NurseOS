import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const updated = await prisma.user.update({
  where: { email: 'wabithetechnurse@nurseos.digital' },
  data: { role: 'SUPER_ADMIN' },
  select: { id: true, email: true, role: true }
})
console.log('Updated:', JSON.stringify(updated, null, 2))
await prisma.$disconnect()
