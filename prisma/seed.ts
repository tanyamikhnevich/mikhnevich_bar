import "dotenv/config";
import { prisma } from "../lib/prisma";

/** Старые демо-строки из раннего seed — удаляем при `prisma db seed`, не трогая импорт/UI. */
const LEGACY_DEMO_WINES: Array<{
  name: string;
  producer: string;
  year: string;
}> = [
  { name: "Barolo Riserva", producer: "Giacomo Conterno", year: "2016" },
  { name: "Opus One", producer: "Opus One Winery", year: "2018" },
  { name: "Château Margaux", producer: "Château Margaux", year: "2015" },
  { name: "Cloudy Bay Sauvignon Blanc", producer: "Cloudy Bay", year: "2021" },
  { name: "Whispering Angel Rosé", producer: "Château d'Esclans", year: "2023" },
  { name: "Chablis Premier Cru", producer: "Domaine William Fèvre", year: "2020" },
  { name: "Franciacorta Brut", producer: "Ca' del Bosco", year: "2019" },
];

async function main() {
  const res = await prisma.wine.deleteMany({
    where: { OR: LEGACY_DEMO_WINES.map((w) => ({ name: w.name, producer: w.producer, year: w.year })) },
  });
  if (res.count > 0) {
    console.log(`Удалено демо-строк из БД (старый seed): ${res.count}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
