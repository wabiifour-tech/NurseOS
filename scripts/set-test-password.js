const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_RFQg1JTECq7U@ep-snowy-firefly-ap4ppwzh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  // Set a known password for the PATIENT test account
  const hash = await bcrypt.hash('PatientTest123', 10);
  await prisma.user.update({
    where: { email: 'strix-patient-a@nurseos.digital' },
    data: { passwordHash: hash }
  });
  console.log('Password set for strix-patient-a@nurseos.digital');
  
  // Also set password for the NURSE test account if needed
  const nurseHash = await bcrypt.hash('NurseTest123', 10);
  await prisma.user.update({
    where: { email: 'strix-test@nurseos.digital' },
    data: { passwordHash: nurseHash }
  });
  console.log('Password set for strix-test@nurseos.digital');
  
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); prisma.$disconnect(); });