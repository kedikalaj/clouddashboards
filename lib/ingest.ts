import { Location } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { conditionLabel, fetchWeatherForLocation, fetchHistoricalWeatherForLocation } from "@/lib/weather";

export type IngestResult = {
  locationId: string;
  status: "ok" | "error";
  message?: string;
};

/**
 * Fetches weather for a single location and persists sample + fetch log.
 */
export async function ingestLocation(loc: Location, days?: number): Promise<IngestResult> {
  try {
    const weatherSamples = days
      ? await fetchHistoricalWeatherForLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          days,
        })
      : [await fetchWeatherForLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
        })];

    for (const weather of weatherSamples) {
      await prisma.weatherSample.create({
        data: {
          locationId: loc.id,
          observedAt: weather.observedAt,
          tempC: weather.tempC,
          windSpeedMs: weather.windSpeedMs,
          precipMm: weather.precipMm,
          visibilityKm: weather.visibilityKm,
          conditionCode: conditionLabel(weather.conditionCode),
          source: weather.source,
        },
      });
    }

    await prisma.fetchLog.create({
      data: {
        locationId: loc.id,
        success: true,
        message: `Ingested ${weatherSamples.length} sample(s) from ${weatherSamples[0].source}`,
        source: weatherSamples[0].source,
      },
    });

    return { locationId: loc.id, status: "ok" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.fetchLog.create({
      data: {
        locationId: loc.id,
        success: false,
        message,
        source: "ingest",
      },
    });
    return { locationId: loc.id, status: "error", message };
  }
}

/**
 * Ingests for a filtered set of locations. If locationId is provided, only that
 * location is ingested. If days is provided, fetches historical data for that many days.
 */
export async function ingestMany(locationId?: string | null, days?: number) {
  const locations = await prisma.location.findMany({
    where: locationId ? { id: locationId } : undefined,
    orderBy: { name: "asc" },
  });

  if (!locations.length) {
    return { locations, results: [], ingested: 0 };
  }

  const results = await Promise.all(locations.map((loc) => ingestLocation(loc, days)));
  const ingested = results.filter((r) => r.status === "ok").length;

  return { locations, results, ingested };
}
