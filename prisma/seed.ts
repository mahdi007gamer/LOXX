import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPw = await argon2.hash("password123");

  const genres = [
    { name: "FPS", icon: "Target" },
    { name: "MOBA", icon: "Swords" },
    { name: "Battle Royale", icon: "Trophy" },
    { name: "Sports", icon: "Activity" },
    { name: "Mafia (Deduction)", icon: "Users" },
    { name: "Board & Party", icon: "Dices" },
    { name: "Strategy (RTS)", icon: "Network" },
    { name: "RPG", icon: "Sword" },
    { name: "Sandbox", icon: "Box" },
    { name: "Simulator", icon: "Cpu" },
    { name: "Racing", icon: "Car" },
    { name: "Horror", icon: "Ghost" },
    { name: "Fighting", icon: "Mic2" },
    { name: "Card Game", icon: "Layers" },
    { name: "Music", icon: "Music" }
  ];

  console.log("Seeding genres...");
  for (const g of genres) {
    await (prisma as any).genre.upsert({
      where: { name: g.name },
      update: { icon: g.icon },
      create: { name: g.name, icon: g.icon },
    });
  }

  const badges = [
    { name: "VIP", iconUrl: "https://cdn-icons-png.flaticon.com/512/1067/1067357.png", isSpecial: true, category: "SPECIAL" },
    { name: "Plus", iconUrl: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png", isSpecial: true, category: "SPECIAL" },
    { name: "Streamer", iconUrl: "https://cdn-icons-png.flaticon.com/512/5968/5968853.png", isSpecial: true, category: "SPECIAL" },
    { name: "Pro Player", iconUrl: "https://cdn-icons-png.flaticon.com/512/4436/4436481.png", isSpecial: true, category: "SPECIAL" },
    { name: "CsGo", iconUrl: "https://cdn-icons-png.flaticon.com/512/10121/10121021.png", isSpecial: false, category: "GAME" },
    { name: "Dota 2", iconUrl: "https://cdn-icons-png.flaticon.com/512/588/588308.png", isSpecial: false, category: "GAME" },
    { name: "Valorant", iconUrl: "https://cdn-icons-png.flaticon.com/512/10121/10121022.png", isSpecial: false, category: "GAME" },
    { name: "LOL", iconUrl: "https://cdn-icons-png.flaticon.com/512/825/825561.png", isSpecial: false, category: "GAME" },
    { name: "Pubg", iconUrl: "https://cdn-icons-png.flaticon.com/512/10121/10121023.png", isSpecial: false, category: "GAME" },
    { name: "Apex", iconUrl: "https://cdn-icons-png.flaticon.com/512/10121/10121024.png", isSpecial: false, category: "GAME" },
    { name: "Fortnite", iconUrl: "https://cdn-icons-png.flaticon.com/512/10121/10121025.png", isSpecial: false, category: "GAME" },
    { name: "RainbowSix", iconUrl: "https://cdn-icons-png.flaticon.com/512/10121/10121026.png", isSpecial: false, category: "GAME" },
    { name: "GTA V", iconUrl: "https://cdn-icons-png.flaticon.com/512/10121/10121027.png", isSpecial: false, category: "GAME" },
    { name: "Minecraft", iconUrl: "https://cdn-icons-png.flaticon.com/512/10121/10121028.png", isSpecial: false, category: "GAME" }
  ];

  console.log("Seeding badges...");
  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: b,
      create: b
    });
  }

  const games = [
    {
      title: "Counter-Strike 2",
      bannerUrl: "https://images.alphacoders.com/132/1328491.jpeg",
      badgeName: "CsGo",
      metadata: { 
        slug: "cs2", 
        description: "Tactical first-person shooter", 
        imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg", 
        genre: "FPS", 
        developer: "Valve", 
        platform: "PC", 
        features: [
           { name: "Mode", options: ["Competitive", "Casual", "Wingman", "Deathmatch"] },
           { name: "Map", options: ["Dust II", "Mirage", "Inferno", "Nuke", "Overpass", "Ancient", "Anubis"] },
           { name: "Side", options: ["Terrorists", "Counter-Terrorists", "Any"] },
           { name: "Level", options: ["Silver", "Gold Nova", "Master Guardian", "Global Elite", "Any"] }
        ]
      }
    },
    {
      title: "Dota 2",
      bannerUrl: "https://images6.alphacoders.com/430/430580.jpg",
      badgeName: "Dota 2",
      metadata: { 
        slug: "dota2", 
        description: "Multiplayer online battle arena", 
        imageUrl: "https://api.typedream.com/v0/images/d6874aee-876e-44d4-a15d-8b0b5103aae6_dota2_png", 
        genre: "MOBA", 
        developer: "Valve", 
        platform: "PC", 
        features: [
           { name: "Mode", options: ["Ranked", "Turbo", "Casual", "All Pick", "Captains Mode"] },
           { name: "Role", options: ["Carry", "Mid", "Offlane", "Support", "Hard Support"] },
           { name: "Rank", options: ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"] }
        ]
      }
    },
    {
      title: "Tom Clancy's Rainbow Six Siege",
      bannerUrl: "https://images4.alphacoders.com/605/605141.jpg",
      badgeName: "RainbowSix",
      metadata: { 
        slug: "r6s", 
        description: "High-precision tactical shooter", 
        imageUrl: "https://ubistatic-a.akamaihd.net/ubicomstatic/en-us/global/search-thumbnail/r6s-search-thumbnail_mobile_224531.jpg", 
        genre: "FPS", 
        developer: "Ubisoft", 
        platform: "PC/Console", 
        features: [
          { name: "Mode", options: ["Ranked", "Standard", "Quick Match", "Arcade"] },
          { name: "Map", options: ["Bank", "Club House", "Oregon", "Kafe", "Consulate"] },
          { name: "Side", options: ["Attackers", "Defenders", "Any"] },
          { name: "Rank", options: ["Copper", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Champion"] }
        ]
      }
    },
    {
      title: "Fortnite",
      bannerUrl: "https://images8.alphacoders.com/891/891823.jpg",
      badgeName: "Fortnite",
      metadata: { 
        slug: "fortnite", 
        description: "Battle Royale, Building, and more", 
        imageUrl: "https://cdn2.unrealengine.com/25br-keyart-1920x1080-1920x1080-f04bf4cf53a2.jpg", 
        genre: "Battle Royale", 
        developer: "Epic Games", 
        platform: "Multi-platform", 
        modes: ["Battle Royale", "Zero Build", "Creative", "Ranked"], 
        maps: ["Current Season Map"],
        features: [
          { name: "Mode", options: ["Build", "Zero Build"] },
          { name: "Rank", options: ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite", "Champion", "Unreal"] }
        ]
      }
    },
    {
      title: "Call of Duty: Warzone",
      bannerUrl: "https://images7.alphacoders.com/106/1066440.jpg",
      badgeName: "Call Of Duty",
      metadata: { 
        slug: "warzone", 
        description: "Massive scale combat arena", 
        imageUrl: "https://www.callofduty.com/content/dam/atvi/callofduty/cod-touchui/warzone/strategy-guide/articles/2023/chapter-1/01b-wz-progression/01B-WZ-Progression-001.jpg", 
        genre: "Battle Royale", 
        developer: "Activision", 
        platform: "PC/Console", 
        modes: ["Battle Royale", "Resurgence", "Plunder"], 
        maps: ["Urzikstan", "Vondel", "Ashika Island"],
        features: [
          { name: "Style", options: ["Aggressive", "Tactical", "Casual"] }
        ]
      }
    },
    {
      title: "Valorant",
      bannerUrl: "https://images.alphacoders.com/108/1089228.jpg",
      badgeName: "Valorant",
      metadata: { 
        slug: "valorant", 
        description: "Character-based tactical shooter", 
        imageUrl: "https://cmsassets.rgpub.io/pb/zh_tr/rso/images/VAL_Standard_1x1_Header.jpg", 
        genre: "FPS", 
        developer: "Riot Games", 
        platform: "PC", 
        modes: ["Ranked", "Unrated", "Swiftplay", "Spike Rush", "Deathmatch"], 
        maps: ["Bind", "Haven", "Split", "Ascent", "Icebox", "Breeze", "Fracture", "Pearl", "Lotus", "Sunset"],
        features: [
          { name: "Character (Agent)", options: ["Jett", "Sage", "Phoenix", "Reyna", "Sova", "Killjoy", "Omen", "Viper", "Chamber", "Gekko"] },
          { name: "Rank", options: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"] }
        ]
      }
    },
    {
      title: "Grand Theft Auto V",
      bannerUrl: "https://images8.alphacoders.com/452/452336.jpg",
      badgeName: "GTA V",
      metadata: { 
        slug: "gtav", 
        description: "Open world action-adventure", 
        imageUrl: "https://media-rockstargames-com.akamaized.net/rockstargames-newsite/img/global/games/fob/640/V.jpg", 
        genre: "Sandbox", 
        developer: "Rockstar North", 
        platform: "PC/Console", 
        modes: ["GTA Online", "Roleplay", "Story Mode"], 
        maps: ["Los Santos"],
        features: [
          { name: "Server Type", options: ["Public", "Roleplay (RP)", "Custom Friends"] }
        ]
      }
    },
    {
      title: "Apex Legends",
      bannerUrl: "https://images.alphacoders.com/100/1002161.jpg",
      badgeName: "Apex",
      metadata: { 
        slug: "apex", 
        description: "Hero shooter Battle Royale", 
        imageUrl: "https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.adapt.crop16x9.1023w.jpg", 
        genre: "Battle Royale", 
        developer: "Respawn", 
        platform: "PC/Console", 
        modes: ["Ranked Leagues", "Trios", "Duos", "Mixtape"], 
        maps: ["Kings Canyon", "World's Edge", "Olympus", "Storm Point", "Broken Moon"],
        features: [
          { name: "Legend", options: ["Wraith", "Pathfinder", "Octane", "Bloodhound", "Lifeline", "Horizon", "Conduit"] },
          { name: "Rank", options: ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Predator"] }
        ]
      }
    },
    {
      title: "PUBG: BATTLEGROUNDS",
      bannerUrl: "https://images.alphacoders.com/838/838141.jpg",
      badgeName: "Pubg",
      metadata: { 
        slug: "pubg", 
        description: "The original Battle Royale", 
        imageUrl: "https://wstatic-prod.pubg.com/web/live/main_ed99a4c/img/6786c5f.jpg", 
        genre: "Battle Royale", 
        developer: "KRAFTON", 
        platform: "PC/Console", 
        features: [
          { name: "Mode", options: ["Ranked", "Normal", "Intense Battle Royale"] },
          { name: "Map", options: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Taego", "Deston", "Rondo"] },
          { name: "Perspective", options: ["FPP", "TPP"] }
        ]
      }
    },
    {
      title: "Minecraft",
      bannerUrl: "https://images4.alphacoders.com/131/1313366.jpeg",
      badgeName: "Minecraft",
      metadata: { 
        slug: "minecraft", 
        description: "Build, explore and survive", 
        imageUrl: "https://www.minecraft.net/content/dam/games/minecraft/key-art/MC-Vanilla-KeyArt.jpg", 
        genre: "Sandbox", 
        developer: "Mojang Studios", 
        platform: "Multi-platform", 
        modes: ["Survival", "Creative", "Hardcore", "Adventure"], 
        maps: ["Infinite procedurally generated"],
        features: [
          { name: "Edition", options: ["Java Edition", "Bedrock Edition"] },
          { name: "Role", options: ["Builder", "Survivor", "Redstoner", "PvPer"] }
        ]
      }
    },
    {
      title: "League of Legends",
      bannerUrl: "https://images.alphacoders.com/640/640822.jpg",
      badgeName: "LOL",
      metadata: { 
        slug: "lol", 
        description: "Fast-paced MOBA", 
        imageUrl: "https://cmsassets.rgpub.io/pb/zh_tr/rso/images/LoL_Header_Standard.jpg", 
        genre: "MOBA", 
        developer: "Riot Games", 
        platform: "PC", 
        modes: ["Ranked Solo/Duo", "Ranked Flex", "ARAM", "Normal Blind/Draft"], 
        maps: ["Summoner's Rift", "Howling Abyss"],
        features: [
          { name: "Role", options: ["Top", "Jungle", "Mid", "ADC", "Support"] },
          { name: "Rank", options: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"] }
        ]
      }
    }
  ];

  for (const g of games) {
    let badgeId = null;
    if (g.badgeName) {
      const badge = await prisma.badge.findUnique({ where: { name: g.badgeName } });
      if (badge) badgeId = badge.id;
    }

    await prisma.game.upsert({
      where: { title: g.title },
      update: {
        badgeId
      },
      create: {
        title: g.title,
        bannerUrl: g.bannerUrl,
        badgeId,
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
