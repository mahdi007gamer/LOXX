import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPw = await argon2.hash("password123");

  // Create some games
  const counterStrike = await prisma.game.upsert({
    where: { title: "Counter-Strike 2" },
    update: {},
    create: {
      title: "Counter-Strike 2",
      bannerUrl: "https://images.alphacoders.com/132/1328491.jpeg",
      metadata: JSON.stringify({
        slug: "cs2",
        description: "Tactical first-person shooter",
        imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
        genre: "FPS",
        developer: "Valve",
        platform: "PC",
        modes: ["Competitive", "Casual", "Wingman"],
        maps: ["Dust II", "Mirage", "Inferno", "Overpass", "Nuke", "Anubis", "Ancient"]
      })
    }
  });

  const dota2 = await prisma.game.upsert({
    where: { title: "Dota 2" },
    update: {},
    create: {
      title: "Dota 2",
      bannerUrl: "https://images6.alphacoders.com/430/430580.jpg",
      metadata: JSON.stringify({
        slug: "dota2",
        description: "Multiplayer online battle arena",
        imageUrl: "https://api.typedream.com/v0/images/d6874aee-876e-44d4-a15d-8b0b5103aae6_dota2_png",
        genre: "MOBA",
        developer: "Valve",
        platform: "PC",
        modes: ["All Pick", "Turbo", "Captains Mode"],
        maps: ["The Dota Map"]
      })
    }
  });

  const valorant = await prisma.game.upsert({
    where: { title: "Valorant" },
    update: {},
    create: {
      title: "Valorant",
      bannerUrl: "https://images.alphacoders.com/108/1089228.jpg",
      metadata: JSON.stringify({
        slug: "valorant",
        description: "Character-based tactical shooter",
        imageUrl: "https://cmsassets.rgpub.io/pb/zh_tr/rso/images/VAL_Standard_1x1_Header.jpg",
        genre: "FPS",
        developer: "Riot Games",
        platform: "PC",
        modes: ["Standard", "Swiftplay", "Competitive"],
        maps: ["Bind", "Haven", "Split", "Ascent", "Icebox", "Breeze", "Fracture", "Pearl", "Lotus"]
      })
    }
  });

  console.log("Seed finished.");

  // Create some users and profiles for leaderboard
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@loxx.ir",
      passwordHash: hashedPw,
      role: "ADMIN",
      profile: {
        create: {
          displayName: "Loxx Admin",
          xp: 10000,
          level: 10,
          region: "Tehran"
        }
      }
    }
  });

  const player1 = await prisma.user.upsert({
    where: { username: "ProPlayer" },
    update: {},
    create: {
      username: "ProPlayer",
      email: "player1@gmail.com",
      passwordHash: hashedPw,
      profile: {
        create: {
          displayName: "Master Shooter",
          xp: 5400,
          level: 5,
          region: "Shiraz"
        }
      }
    }
  });

  console.log("Users and Profiles seeded.");
  
  // Create Mahdi as VIP user
  const mahdiPw = await argon2.hash("m1m2m3");
  await prisma.user.upsert({
    where: { username: "mahdi" },
    update: {},
    create: {
      username: "mahdi",
      email: "10mahdi10mahdi10@gmail.com",
      passwordHash: mahdiPw,
      role: "USER",
      profile: {
        create: {
          displayName: "Mahdi VIP",
          membershipType: "VIP",
          xp: 15000,
          level: 15,
          region: "Tehran",
          avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mahdi",
          bannerUrl: "https://images.alphacoders.com/132/1328491.jpeg",
          vipMetadata: JSON.stringify({
            crownType: "GOLD",
            glowColor: "#FFD700"
          })
        }
      }
    }
  });

  console.log("Mahdi VIP user seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
