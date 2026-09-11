const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const email = 'aminehamzaoui1924@gmail.com';
  const users = await prisma.user.findMany({
    where: { email },
    select: { id: true, email: true, firstName: true, lastName: true, status: true, isActive: true, companyId: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(users, null, 2));
  const companies = await prisma.company.findMany({
    where: { email },
    select: { id: true, name: true, email: true, createdAt: true }
  });
  console.log('---COMPANIES---');
  console.log(JSON.stringify(companies, null, 2));
  await prisma.$disconnect();
})();
