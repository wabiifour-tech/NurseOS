const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_RFQg1JTECq7U@ep-snowy-firefly-ap4ppwzh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    select: { id: true, email: true, role: true, status: true, facilityId: true },
    take: 5
  });
  console.log('PATIENT users:', JSON.stringify(patients, null, 2));
  
  const nurses = await prisma.user.findMany({
    where: { role: 'NURSE', status: 'ACTIVE' },
    select: { id: true, email: true, role: true, status: true, facilityId: true },
    take: 5
  });
  console.log('NURSE users:', JSON.stringify(nurses, null, 2));
  
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, status: 'ACTIVE' },
    select: { id: true, email: true, role: true, status: true, facilityId: true },
    take: 5
  });
  console.log('ADMIN users:', JSON.stringify(admins, null, 2));

  const facilities = await prisma.facility.findMany({
    select: { id: true, name: true },
    take: 5
  });
  console.log('Facilities:', JSON.stringify(facilities, null, 2));
  
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); prisma.$disconnect(); });
