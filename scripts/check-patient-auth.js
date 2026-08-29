const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_RFQg1JTECq7U@ep-snowy-firefly-ap4ppwzh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    select: { id: true, email: true, passwordHash: true, status: true, facilityId: true },
    take: 5
  });
  for (const p of patients) {
    console.log({ email: p.email, hasPassword: !!p.passwordHash, status: p.status, facilityId: p.facilityId });
  }
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); prisma.$disconnect(); });