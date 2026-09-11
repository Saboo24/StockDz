const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const email = 'aminehamzaoui1924@gmail.com';
  const rows = await prisma.user.findMany({
    where: { email },
    select: { id: true, email: true, firstName: true, lastName: true, status: true, isActive: true, companyId: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(rows));
  await prisma.$disconnect();
})();
