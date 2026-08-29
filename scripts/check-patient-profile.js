const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_RFQg1JTECq7U@ep-snowy-firefly-ap4ppwzh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  const u = await prisma.user.findUnique({
    where: { email: 'strix-patient-a@nurseos.digital' },
    select: {
      id: true, role: true, facilityId: true,
      nurseProfile: { select: { id: true, currentFacilityId: true } },
      adminProfile: { select: { id: true, facilityId: true } },
      patientProfile: { select: { id: true, facilityId: true } },
    }
  });
  console.log(JSON.stringify(u, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); prisma.$disconnect(); });