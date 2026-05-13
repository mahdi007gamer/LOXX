import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin
  const adminPhone = "13781378";
  const adminPassword = "mmnnnh1378FG!";
  const adminHash = await argon2.hash(adminPassword);

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      passwordHash: adminHash,
      isVerified: true,
      role: "ADMIN"
    },
    create: {
      username: "admin",
      phone: adminPhone,
      email: "admin@loxx.ir",
      passwordHash: adminHash,
      isVerified: true,
      role: "ADMIN",
      profile: {
        create: {
          displayName: "Admin",
          membershipType: "VIP"
        }
      }
    }
  });

  // VIP User
  const vipPhone = "123";
  const vipPassword = "321321";
  const vipHash = await argon2.hash(vipPassword);

  await prisma.user.upsert({
    where: { phone: vipPhone },
    update: {
      passwordHash: vipHash,
      isVerified: false
    },
    create: {
      username: "VIP",
      phone: vipPhone,
      email: "vip@loxx.ir",
      passwordHash: vipHash,
      isVerified: false,
      role: "USER",
      profile: {
        create: {
          displayName: "VIP User",
          membershipType: "VIP"
        }
      }
    }
  });

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
