import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  try {
    const res = await prisma.userBadge.deleteMany({
      where: { userId: "some_id", badgeId: "some_id" }
    });
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
run();
