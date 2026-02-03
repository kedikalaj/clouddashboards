import { WeatherSample } from "@prisma/client";
import { startOfDay, subDays, subHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { calculateRiskScore, conditionLabel, isSevere, summarizeConditions } from "./weather";

export type DailyAggregateInput = {
  locationId: string;
  samples: WeatherSample[];
  now?: Date;
};

export type OverviewMetrics = {
  windowHours: number;
  sampleCount: number;
  tempAvgC: number | null;
  windAvgMs: number | null;
  precipTotalMm: number | null;
  visibilityAvgKm: number | null;
  riskAvg: number | null;
  severeCount: number;
  conditionCounts: Record<string, number>;
};

export type TrendPoint = ReturnType<typeof buildDailyAggregate> & {
  locationName?: string;
};

export type ComparisonRow = {
  locationId: string;
  locationName: string;
  tempAvgC: number | null;
  windAvgMs: number | null;
  precipTotalMm: number | null;
  visibilityAvgKm: number | null;
  riskAvg: number | null;
  severeCount: number;
};

export type LiveSample = {
  locationId: string;
  locationName: string;
  observedAt: Date;
  tempC: number | null;
  windSpeedMs: number | null;
  precipMm: number | null;
  visibilityKm: number | null;
  conditionCode: string;
  severe: boolean;
  risk: number;
};

export function buildDailyAggregate({ locationId, samples, now = new Date() }: DailyAggregateInput) {
  if (!samples.length) {
    return null;
  }

  const temps = numericValues(samples.map((s) => s.tempC));
  const winds = numericValues(samples.map((s) => s.windSpeedMs));
  const precip = numericValues(samples.map((s) => s.precipMm));
  const visibility = numericValues(samples.map((s) => s.visibilityKm));
  const risks = samples.map((s) => calculateRiskScore(normalizeSample(s)));

  const conditionCounts = summarizeConditions(samples);
  const riskScore = Math.round(risks.reduce((a, b) => a + b, 0) / risks.length);
  const severeFlag = samples.some((s) => isSevere(normalizeSample(s)));

  return {
    locationId,
    date: startOfDay(now),
    tempMinC: temps.length ? Math.min(...temps) : null,
    tempMaxC: temps.length ? Math.max(...temps) : null,
    tempAvgC: temps.length ? avg(temps) : null,
    windAvgMs: winds.length ? avg(winds) : null,
    precipTotalMm: precip.length ? sum(precip) : null,
    visibilityAvgKm: visibility.length ? avg(visibility) : null,
    conditionCounts: JSON.stringify(conditionCounts),
    riskScore,
    severeFlag,
  };
}

export function recentWindowCutoff(hours: number): Date {
  return subHours(new Date(), hours);
}

export function normalizeSample(sample: WeatherSample) {
  return {
    observedAt: sample.observedAt,
    tempC: sample.tempC,
    windSpeedMs: sample.windSpeedMs,
    precipMm: sample.precipMm,
    visibilityKm: sample.visibilityKm,
    conditionCode: conditionLabel(sample.conditionCode),
    source: sample.source ?? "unknown",
  };
}

function numericValues(values: Array<number | null>): number[] {
  return values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
}

function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export async function getOverviewMetrics(hours = 24): Promise<OverviewMetrics> {
  const since = subHours(new Date(), hours);
  const samples = await prisma.weatherSample.findMany({
    where: { observedAt: { gte: since } },
    include: { location: true },
    orderBy: { observedAt: "desc" },
  });

  const temps = numericValues(samples.map((s) => s.tempC));
  const winds = numericValues(samples.map((s) => s.windSpeedMs));
  const precip = numericValues(samples.map((s) => s.precipMm));
  const visibility = numericValues(samples.map((s) => s.visibilityKm));
  const risks = samples.map((s) => calculateRiskScore(normalizeSample(s)));

  const conditionCounts = summarizeConditions(samples);
  const severeCount = samples.filter((s) => isSevere(normalizeSample(s))).length;

  return {
    windowHours: hours,
    sampleCount: samples.length,
    tempAvgC: temps.length ? avg(temps) : null,
    windAvgMs: winds.length ? avg(winds) : null,
    precipTotalMm: precip.length ? sum(precip) : null,
    visibilityAvgKm: visibility.length ? avg(visibility) : null,
    riskAvg: risks.length ? avg(risks) : null,
    severeCount,
    conditionCounts,
  };
}

export async function getTrendSeries(days = 7): Promise<{ points: TrendPoint[] }> {
  const start = subDays(startOfDay(new Date()), days - 1);
  const samples = await prisma.weatherSample.findMany({
    where: { observedAt: { gte: start } },
    include: { location: true },
    orderBy: { observedAt: "asc" },
  });

  const bucket = new Map<string, WeatherSample[]>();
  const locationNames = new Map<string, string>();

  for (const sample of samples) {
    const dayKey = startOfDay(sample.observedAt).toISOString();
    const key = `${sample.locationId}::${dayKey}`;
    const list = bucket.get(key) ?? [];
    list.push(sample);
    bucket.set(key, list);
    if (sample.location) {
      locationNames.set(sample.locationId, sample.location.name);
    }
  }

  const points: TrendPoint[] = [];
  for (const [key, daySamples] of bucket.entries()) {
    const [locationId, iso] = key.split("::");
    const agg = buildDailyAggregate({ locationId, samples: daySamples, now: new Date(iso) });
    if (agg) {
      points.push({ ...agg, locationName: locationNames.get(locationId) });
    }
  }

  points.sort((a, b) => a.date.getTime() - b.date.getTime());

  return { points };
}

export async function getComparison(days = 3): Promise<{ rows: ComparisonRow[] }> {
  const since = subDays(new Date(), days);
  const samples = await prisma.weatherSample.findMany({
    where: { observedAt: { gte: since } },
    include: { location: true },
  });

  const grouped = new Map<string, WeatherSample[]>();
  const names = new Map<string, string>();

  for (const sample of samples) {
    const list = grouped.get(sample.locationId) ?? [];
    list.push(sample);
    grouped.set(sample.locationId, list);
    if (sample.location) names.set(sample.locationId, sample.location.name);
  }

  const rows: ComparisonRow[] = [];
  for (const [locationId, list] of grouped.entries()) {
    const temps = numericValues(list.map((s) => s.tempC));
    const winds = numericValues(list.map((s) => s.windSpeedMs));
    const precip = numericValues(list.map((s) => s.precipMm));
    const visibility = numericValues(list.map((s) => s.visibilityKm));
    const risks = list.map((s) => calculateRiskScore(normalizeSample(s)));
    const severeCount = list.filter((s) => isSevere(normalizeSample(s))).length;

    rows.push({
      locationId,
      locationName: names.get(locationId) ?? locationId,
      tempAvgC: temps.length ? avg(temps) : null,
      windAvgMs: winds.length ? avg(winds) : null,
      precipTotalMm: precip.length ? sum(precip) : null,
      visibilityAvgKm: visibility.length ? avg(visibility) : null,
      riskAvg: risks.length ? avg(risks) : null,
      severeCount,
    });
  }

  rows.sort((a, b) => a.locationName.localeCompare(b.locationName));

  return { rows };
}

export async function getLiveWindow(hours = 6): Promise<{ samples: LiveSample[] }> {
  const since = subHours(new Date(), hours);
  const samples = await prisma.weatherSample.findMany({
    where: { observedAt: { gte: since } },
    include: { location: true },
    orderBy: { observedAt: "desc" },
  });

  const latest = new Map<string, LiveSample>();

  for (const s of samples) {
    if (latest.has(s.locationId)) continue;
    const normalized = normalizeSample(s);
    latest.set(s.locationId, {
      locationId: s.locationId,
      locationName: s.location?.name ?? s.locationId,
      observedAt: s.observedAt,
      tempC: s.tempC,
      windSpeedMs: s.windSpeedMs,
      precipMm: s.precipMm,
      visibilityKm: s.visibilityKm,
      conditionCode: normalized.conditionCode,
      severe: isSevere(normalized),
      risk: calculateRiskScore(normalized),
    });
  }

  return { samples: Array.from(latest.values()) };
}
