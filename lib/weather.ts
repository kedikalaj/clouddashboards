import { WeatherSample } from "@prisma/client";

export type WeatherProvider = "open-meteo" | "openweathermap";

export type NormalizedWeather = {
  observedAt: Date;
  tempC: number | null;
  windSpeedMs: number | null;
  precipMm: number | null;
  visibilityKm: number | null;
  conditionCode: string;
  source: string;
};

const PROVIDER: WeatherProvider =
  (process.env.WEATHER_PROVIDER as WeatherProvider) || "open-meteo";

export function conditionLabel(code: string): string {
  const normalized = code.toLowerCase();
  if (normalized.includes("storm") || normalized.includes("thunder")) return "Storm";
  if (normalized.includes("rain")) return "Rain";
  if (normalized.includes("snow")) return "Snow";
  if (normalized.includes("fog") || normalized.includes("mist")) return "Fog";
  if (normalized.includes("cloud")) return "Cloudy";
  if (normalized.includes("clear")) return "Clear";
  return code;
}

export function isSevere(sample: NormalizedWeather): boolean {
  return (
    (sample.windSpeedMs ?? 0) >= 20 ||
    (sample.precipMm ?? 0) >= 15 ||
    (sample.tempC ?? 0) <= -10 ||
    (sample.tempC ?? 0) >= 42 ||
    conditionLabel(sample.conditionCode).toLowerCase() === "storm"
  );
}

export function calculateRiskScore(sample: NormalizedWeather): number {
  const wind = Math.min(((sample.windSpeedMs ?? 0) / 30) * 40, 40);
  const precip = Math.min(((sample.precipMm ?? 0) / 20) * 30, 30);
  const tempExtreme = sample.tempC ?? 0;
  const temp = tempExtreme < -5 || tempExtreme > 35 ? 20 : tempExtreme < 0 || tempExtreme > 30 ? 10 : 0;
  const visibilityPenalty = (sample.visibilityKm ?? 10) < 1 ? 20 : (sample.visibilityKm ?? 10) < 3 ? 10 : 0;
  const base = wind + precip + temp + visibilityPenalty;
  return Math.min(100, Math.round(base));
}

export function summarizeConditions(samples: WeatherSample[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of samples) {
    const label = conditionLabel(s.conditionCode);
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return counts;
}

export async function fetchWeatherForLocation(args: {
  latitude: number;
  longitude: number;
}): Promise<NormalizedWeather> {
  if (PROVIDER === "openweathermap") {
    return fetchOpenWeatherMap(args);
  }
  return fetchOpenMeteo(args);
}

async function fetchOpenMeteo({ latitude, longitude }: { latitude: number; longitude: number }): Promise<NormalizedWeather> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: "temperature_2m,wind_speed_10m,precipitation,visibility,weather_code",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status}`);
  }

  const json = await res.json();
  const current = json.current ?? {};
  return {
    observedAt: current.time ? new Date(current.time) : new Date(),
    tempC: numberOrNull(current.temperature_2m),
    windSpeedMs: numberOrNull(current.wind_speed_10m),
    precipMm: numberOrNull(current.precipitation),
    visibilityKm: numberOrNull((current.visibility ?? null) !== null ? current.visibility / 1000 : null),
    conditionCode: String(current.weather_code ?? "unknown"),
    source: "open-meteo",
  };
}

async function fetchOpenWeatherMap({ latitude, longitude }: { latitude: number; longitude: number }): Promise<NormalizedWeather> {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("WEATHER_API_KEY missing for openweathermap provider");
  }
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
    units: "metric",
    appid: apiKey,
  });
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?${params.toString()}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`OpenWeatherMap request failed: ${res.status}`);
  }
  const json = await res.json();
  const weather = (json.weather && json.weather[0]) || {};
  return {
    observedAt: json.dt ? new Date(json.dt * 1000) : new Date(),
    tempC: numberOrNull(json.main?.temp),
    windSpeedMs: numberOrNull(json.wind?.speed),
    precipMm: numberOrNull(json.rain?.["1h"] ?? json.snow?.["1h"] ?? 0),
    visibilityKm: numberOrNull((json.visibility ?? null) !== null ? json.visibility / 1000 : null),
    conditionCode: weather.main ? String(weather.main) : "unknown",
    source: "openweathermap",
  };
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
