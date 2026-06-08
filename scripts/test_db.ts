import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing Prisma connection...');
    const count = await prisma.user.count();
    console.log('User count:', count);
    process.exit(0);
  } catch (error) {
    console.error('Prisma connection failed:', error);
    process.exit(1);
  }
}

test();
