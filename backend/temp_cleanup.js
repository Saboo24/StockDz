const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  });

  const keepEmail = 'aminecodes1@gmail.com';
  const toDelete = users.filter((u) => u.email !== keepEmail);

  console.log('DELETE_COUNT', toDelete.length);
  console.log('DELETE_EMAILS', JSON.stringify(toDelete.map((u) => u.email)));

  if (toDelete.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: toDelete.map((u) => u.id) } },
    });
  }

  const remaining = await prisma.user.findMany({
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log('REMAINING_COUNT', remaining.length);
  console.log('REMAINING_EMAILS', JSON.stringify(remaining.map((u) => u.email)));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
