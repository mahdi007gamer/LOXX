import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GAME_BADGES = [
  "RainbowSix", "Dota 2", "CsGo", "GTA V", "Call Of Duty", "Fortnite", "Pubg", "Zula", "BattleField", "Apex", "Mincraft", "LOL", "WOW", "Rust"
];

const STANDARD_BADGES = [
  "Smoker", "Sniper", "Rifel", "Faghir", "Feshari", "BCool", "Ferferi", "SuperLag", "Jooje", "Noob", "Weed", "Falaj", "Systemy", "Mobile Gamer"
];

const SPECIAL_BADGES = [
  "Streamer", "Verify", "Helper", "Pro Player", "Leader"
];

async function main() {
  console.log("Seeding badges...");

  // Clear existing if needed or just upsert
  for (const name of GAME_BADGES) {
    await prisma.badge.upsert({
      where: { name },
      update: { category: "GAME", iconUrl: `/badges/${name.toLowerCase().replace(/\s+/g, '-')}.png` },
      create: { name, category: "GAME", iconUrl: `/badges/${name.toLowerCase().replace(/\s+/g, '-')}.png` }
    });
  }

  for (const name of STANDARD_BADGES) {
    await prisma.badge.upsert({
      where: { name },
      update: { category: "STANDARD", iconUrl: `/badges/${name.toLowerCase().replace(/\s+/g, '-')}.png` },
      create: { name, category: "STANDARD", iconUrl: `/badges/${name.toLowerCase().replace(/\s+/g, '-')}.png` }
    });
  }

  for (const name of SPECIAL_BADGES) {
    await prisma.badge.upsert({
      where: { name },
      update: { category: "SPECIAL", isSpecial: true, iconUrl: `/badges/${name.toLowerCase().replace(/\s+/g, '-')}.png` },
      create: { name, category: "SPECIAL", isSpecial: true, iconUrl: `/badges/${name.toLowerCase().replace(/\s+/g, '-')}.png` }
    });
  }

  console.log("Badges seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
