import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const users = await prisma.user.findMany({
  include: {
    adminProfile: true,
    nurseProfile: true,
  }
})
for (const u of users) {
  console.log(`${u.email} | role=${u.role} | adminProfile.accessLevel=${u.adminProfile?.accessLevel} | adminProfile.role=${u.adminProfile?.role}`)
}
await prisma.$disconnect()
