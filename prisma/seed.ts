import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const locations = [
  {
    name: "Los Angeles Port",
    locationType: "PORT",
    latitude: 33.7406,
    longitude: -118.2775,
    timezone: "America/Los_Angeles",
  },
  {
    name: "New York Harbor",
    locationType: "PORT",
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
  },
  {
    name: "Rotterdam Port",
    locationType: "PORT",
    latitude: 51.9244,
    longitude: 4.4777,
    timezone: "Europe/Amsterdam",
  },
  {
    name: "Singapore Hub",
    locationType: "PORT",
    latitude: 1.3521,
    longitude: 103.8198,
    timezone: "Asia/Singapore",
  },
  {
    name: "Pacific Northern Route",
    locationType: "ROUTE",
    latitude: 55.0,
    longitude: -150.0,
    timezone: "Etc/UTC",
  },
  {
    name: "Gulf Coast Corridor",
    locationType: "ROUTE",
    latitude: 29.0,
    longitude: -90.0,
    timezone: "America/Chicago",
  },
];

async function main() {
  for (const loc of locations) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: loc,
      create: loc,
    });
  }

  console.log(`Seeded ${locations.length} locations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
