const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findFirst({
  where: { email: 'aminecodes1@gmail.com' },
  select: {
    email: true,
    resetCodeHash: true,
    resetCodeExpiresAt: true,
    resetCodeUsedAt: true,
    passwordHash: true,
  },
}).then(user => {
  console.log(JSON.stringify(user, null, 2));
}).catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
