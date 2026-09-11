const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const email = 'aminecodes1@gmail.com';
const code = '123456';
const hash = crypto.createHash('sha256').update(code).digest('hex');

prisma.user.findFirst({
  where: {
    email,
    resetCodeHash: hash,
    resetCodeExpiresAt: { gt: new Date() },
    resetCodeUsedAt: null,
  },
  select: { email: true, resetCodeHash: true, resetCodeExpiresAt: true },
}).then((u) => {
  console.log(JSON.stringify({ found: !!u, code, hash, dbHash: u && u.resetCodeHash }, null, 2));
}).catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
