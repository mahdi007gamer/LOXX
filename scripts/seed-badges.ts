import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STANDARD_BADGES = [
  { name: "RainbowSix", iconUrl: "/badges/r6.png" },
  { name: "Dota 2", iconUrl: "/badges/dota2.png" },
  { name: "CsGo", iconUrl: "/badges/csgo.png" },
  { name: "GTA V", iconUrl: "/badges/gtav.png" },
  { name: "Call Of Duty", iconUrl: "/badges/cod.png" },
  { name: "Fortnite", iconUrl: "/badges/fortnite.png" },
  { name: "Pubg", iconUrl: "/badges/pubg.png" },
  { name: "Zula", iconUrl: "/badges/zula.png" },
  { name: "BattleField", iconUrl: "/badges/bf.png" },
  { name: "Apex", iconUrl: "/badges/apex.png" },
  { name: "Mincraft", iconUrl: "/badges/minecraft.png" },
  { name: "LOL", iconUrl: "/badges/lol.png" },
  { name: "WOW", iconUrl: "/badges/wow.png" },
  { name: "Rust", iconUrl: "/badges/rust.png" }
];

const USER_CHOICE_BADGES = [
  { name: "Smoker", iconUrl: "/badges/smoker.png" },
  { name: "Sniper", iconUrl: "/badges/sniper.png" },
  { name: "Rifel", iconUrl: "/badges/rifel.png" },
  { name: "Faghir", iconUrl: "/badges/faghir.png" },
  { name: "Feshari", iconUrl: "/badges/feshari.png" },
  { name: "BCool", iconUrl: "/badges/bcool.png" },
  { name: "Ferferi", iconUrl: "/badges/ferferi.png" },
  { name: "SuperLag", iconUrl: "/badges/superlag.png" },
  { name: "Jooje", iconUrl: "/badges/jooje.png" },
  { name: "Noob", iconUrl: "/badges/noob.png" },
  { name: "Weed", iconUrl: "/badges/weed.png" },
  { name: "Falaj", iconUrl: "/badges/falaj.png" },
  { name: "Systemy", iconUrl: "/badges/systemy.png" },
  { name: "Mobile Gamer", iconUrl: "/badges/mobile.png" }
];

const SPECIAL_BADGES = [
  { name: "Streamer", iconUrl: "/badges/streamer.png", isSpecial: true, category: "SPECIAL" },
  { name: "Verify", iconUrl: "/badges/verify.png", isSpecial: true, category: "SPECIAL" },
  { name: "Helper", iconUrl: "/badges/helper.png", isSpecial: true, category: "SPECIAL" },
  { name: "Pro Player", iconUrl: "/badges/pro.png", isSpecial: true, category: "SPECIAL" },
  { name: "Leader", iconUrl: "/badges/leader.png", isSpecial: true, category: "SPECIAL" }
];

async function main() {
  console.log('Seeding badges...');

  for (const badge of [...STANDARD_BADGES, ...USER_CHOICE_BADGES]) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: {
        name: badge.name,
        iconUrl: badge.iconUrl,
        isSpecial: false,
        category: "STANDARD"
      }
    });
  }

  for (const badge of SPECIAL_BADGES) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: {
        name: badge.name,
        iconUrl: badge.iconUrl,
        isSpecial: true,
        category: "SPECIAL"
      }
    });
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
