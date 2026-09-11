const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { email: 'admin@stockdz.dz' },
    data: {
      status: 'APPROVED',
      isActive: true,
      approvalTokenHash: null,
      approvalTokenExpiresAt: null,
      approvalTokenUsedAt: null,
    },
  });

  const rows = await prisma.user.findMany({
    where: { email: 'admin@stockdz.dz' },
    select: { email: true, status: true, isActive: true },
  });

  console.log(JSON.stringify({ updated: result.count, rows }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
