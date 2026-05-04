import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding LOXX database...");

  // Games
  const games = [
    { title: "مافیا آنلاین", bannerUrl: "https://placehold.co/600x400?text=Mafia" },
    { title: "منچ", bannerUrl: "https://placehold.co/600x400?text=Ludo" },
    { title: "حکم", bannerUrl: "https://placehold.co/600x400?text=Hokm" },
    { title: "تخته نرد", bannerUrl: "https://placehold.co/600x400?text=Backgammon" }
  ];

  for (const game of games) {
    const g = await prisma.game.upsert({
      where: { title: game.title },
      update: {},
      create: game
    });

    // Channels for each game
    await prisma.channel.create({
      data: {
        title: `گفتگو ${game.title}`,
        gameId: g.id
      }
    });
  }

  // Global Channels
  await prisma.channel.create({
    data: { title: "گفتگوی عمومی" }
  });

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
