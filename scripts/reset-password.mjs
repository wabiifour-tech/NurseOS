import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
const newHash = await bcrypt.hash('NurseOS2025!', 10)
const updated = await prisma.user.update({
  where: { email: 'wabithetechnurse@nurseos.digital' },
  data: { passwordHash: newHash },
  select: { id: true, email: true, role: true }
})
console.log('Password reset. User:', JSON.stringify(updated, null, 2))
await prisma.$disconnect()
