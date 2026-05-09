import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPw = await argon2.hash("password123");

  const games = [
    {
      title: "Counter-Strike 2",
      bannerUrl: "https://images.alphacoders.com/132/1328491.jpeg",
      metadata: { slug: "cs2", description: "Tactical first-person shooter", imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg", genre: "FPS", developer: "Valve", platform: "PC", modes: ["Competitive", "Casual", "Wingman"], maps: ["Dust II", "Mirage", "Inferno"] }
    },
    {
      title: "Dota 2",
      bannerUrl: "https://images6.alphacoders.com/430/430580.jpg",
      metadata: { slug: "dota2", description: "Multiplayer online battle arena", imageUrl: "https://api.typedream.com/v0/images/d6874aee-876e-44d4-a15d-8b0b5103aae6_dota2_png", genre: "MOBA", developer: "Valve", platform: "PC", modes: ["Ranked", "Turbo", "Casual"], maps: ["The Dota Map"] }
    },
    {
      title: "Valorant",
      bannerUrl: "https://images.alphacoders.com/108/1089228.jpg",
      metadata: { slug: "valorant", description: "Character-based tactical shooter", imageUrl: "https://cmsassets.rgpub.io/pb/zh_tr/rso/images/VAL_Standard_1x1_Header.jpg", genre: "FPS", developer: "Riot Games", platform: "PC", modes: ["Ranked", "Swiftplay", "Casual"], maps: ["Bind", "Haven", "Split"] }
    },
    {
      title: "Mafia (مافیا)",
      bannerUrl: "https://images.alphacoders.com/101/1018599.jpg",
      metadata: { slug: "mafia", description: "A game of psychological deduction", imageUrl: "https://images.alphacoders.com/101/1018599.jpg", genre: "Board/Party", developer: "Community", platform: "Online/Voice", modes: ["Classic (10 Player)", "Godfather (12 Player)", "Turbo (Voice)"], maps: ["Town"] }
    },
    {
      title: "Poker Online (پوکر)",
      bannerUrl: "https://images.alphacoders.com/979/979685.jpg",
      metadata: { slug: "poker", description: "Texas Hold'em and Online Card Games", imageUrl: "https://images.alphacoders.com/979/979685.jpg", genre: "Card Game", developer: "Various", platform: "Web", modes: ["Casual", "Ranked Tournament", "Sit & Go"], maps: ["Green Table"] }
    },
    {
      title: "League of Legends",
      bannerUrl: "https://images6.alphacoders.com/112/1126786.jpg",
      metadata: { slug: "lol", description: "Online team vs team arena", imageUrl: "https://yt3.googleusercontent.com/v1uA7fQj9G7U0g1VzP6b_y9E3Z-z9T8y5U_S4Q8y5Y2q4U_6H_u7O_u8T_z_V_X_Z_B_b9c=s900-c-k-c0x00ffffff-no-rj", genre: "MOBA", developer: "Riot Games", platform: "PC", modes: ["Ranked", "ARAM", "Casual"], maps: ["Summoner's Rift"] }
    },
    {
      title: "Call of Duty: Warzone",
      bannerUrl: "https://images.alphacoders.com/106/1069695.jpg",
      metadata: { slug: "warzone", description: "Battle Royale", imageUrl: "https://www.callofduty.com/content/dam/atvi/callofduty/cod-touchui/kronos/common/social-share/social-share-image.jpg", genre: "Battle Royale", developer: "Activision", platform: "PC/Console", modes: ["Ranked Resurgence", "Battle Royale Quad", "Solo"], maps: ["Urzikstan", "Rebirth Island"] }
    },
    {
      title: "Apex Legends",
      bannerUrl: "https://images.alphacoders.com/100/1002161.jpg",
      metadata: { slug: "apex", description: "Hero shooter Battle Royale", imageUrl: "https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop16x9.1023w.jpg", genre: "Battle Royale", developer: "Respawn", platform: "PC/Console", modes: ["Ranked Leagues", "Trios", "Mixtape"], maps: ["World's Edge", "Olympus"] }
    },
    {
      title: "Minecraft",
      bannerUrl: "https://images.alphacoders.com/114/1148766.jpg",
      metadata: { slug: "minecraft", description: "Sandbox survival", imageUrl: "https://www.minecraft.net/content/dam/games/minecraft/key-art/Games_Subnav_Minecraft-300x465.jpg", genre: "Sandbox", developer: "Mojang", platform: "All", modes: ["Survival Multiplayer", "Creative", "Minigames"], maps: ["Overworld"] }
    },
    {
      title: "EA SPORTS FC 24",
      bannerUrl: "https://images.alphacoders.com/132/1321033.jpeg",
      metadata: { slug: "fc24", description: "Football Simulation", imageUrl: "https://media.contentapi.ea.com/content/dam/ea/fc/fc-24/common/fc24-featured-image-16x9.jpg.adapt.crop16x9.1023w.jpg", genre: "Sports", developer: "EA Sports", platform: "PC/Console", modes: ["Ultimate Team (Ranked)", "Pro Clubs", "Kick-off (Casual)"], maps: ["Stadiums"] }
    }
  ];

  for (const g of games) {
    await prisma.game.upsert({
      where: { title: g.title },
      update: {},
      create: {
        title: g.title,
        bannerUrl: g.bannerUrl,
        metadata: JSON.stringify(g.metadata)
      }
    });
  }

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
