const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    status: true,
    isActive: true,
    resetCodeHash: true,
    resetCodeExpiresAt: true,
    resetCodeUsedAt: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
}).then(rows => {
  console.log(JSON.stringify(rows, null, 2));
}).catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
