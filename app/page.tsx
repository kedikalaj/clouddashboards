"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OverviewMetrics = {
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

type TrendPoint = {
  locationId: string;
  locationName?: string;
  date: string;
  tempMinC: number | null;
  tempMaxC: number | null;
  tempAvgC: number | null;
  windAvgMs: number | null;
  precipTotalMm: number | null;
  visibilityAvgKm: number | null;
  conditionCounts: string | null;
  riskScore: number | null;
  severeFlag: boolean;
};

type LiveSample = {
  locationId: string;
  locationName: string;
  observedAt: string;
  tempC: number | null;
  windSpeedMs: number | null;
  precipMm: number | null;
  visibilityKm: number | null;
  conditionCode: string;
  severe: boolean;
  risk: number;
};

const pieColors = ["#1f2937", "#2563eb", "#f97316", "#4b5563", "#9ca3af"];

export default function Home() {
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [live, setLive] = useState<LiveSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [ingestingHistorical, setIngestingHistorical] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);

  const fetchDashboard = async (options?: { hours?: number; days?: number }) => {
    setLoading(true);
    setIngestMessage(null);
    try {
      const overviewUrl = new URL("/api/analytics/overview", window.location.origin);
      const trendsUrl = new URL("/api/analytics/trends", window.location.origin);
      
      if (options?.hours) {
        overviewUrl.searchParams.set("hours", options.hours.toString());
      }
      if (options?.days) {
        trendsUrl.searchParams.set("days", options.days.toString());
      }

      const [overviewRes, trendsRes, liveRes] = await Promise.all([
        fetch(overviewUrl.toString(), { cache: "no-store" }),
        fetch(trendsUrl.toString(), { cache: "no-store" }),
        fetch("/api/live", { cache: "no-store" }),
      ]);

      const overviewJson = await overviewRes.json();
      const trendsJson = await trendsRes.json();
      const liveJson = await liveRes.json();

      setOverview(overviewJson);
      setTrends(trendsJson.points ?? []);
      setLive(liveJson.samples ?? []);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      setOverview(null);
      setTrends([]);
      setLive([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerIngest = async () => {
    setIngesting(true);
    setIngestMessage(null);
    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Ingest failed");
      }
      setIngestMessage(`Ingested ${json.ingested ?? 0} locations.`);
      await fetchDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setIngestMessage(`Ingest error: ${message}`);
    } finally {
      setIngesting(false);
    }
  };

  const triggerIngestHistorical = async () => {
    setIngestingHistorical(true);
    setIngestMessage(null);
    try {
      const res = await fetch("/api/ingest?days=10", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Ingest failed");
      }
      setIngestMessage(`Ingested ${json.ingested ?? 0} locations (last 10 days).`);
      // Fetch dashboard with 10 days of data to show the historical data
      await fetchDashboard({ hours: 240, days: 10 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setIngestMessage(`Ingest error: ${message}`);
    } finally {
      setIngestingHistorical(false);
    }
  };

  const kpis = useMemo(() => {
    if (!overview) return [];
    return [
      {
        label: `Avg Temp (${overview.windowHours}h)` ,
        value: overview.tempAvgC !== null ? `${overview.tempAvgC.toFixed(1)}°C` : "--",
        sub: overview.tempAvgC !== null ? `Samples: ${overview.sampleCount}` : "No data",
      },
      {
        label: `Avg Wind (${overview.windowHours}h)`,
        value: overview.windAvgMs !== null ? `${overview.windAvgMs.toFixed(1)} m/s` : "--",
        sub: overview.visibilityAvgKm !== null ? `Visibility ${overview.visibilityAvgKm.toFixed(1)} km` : "No data",
      },
      {
        label: `Precip (${overview.windowHours}h)`,
        value: overview.precipTotalMm !== null ? `${overview.precipTotalMm.toFixed(1)} mm` : "--",
        sub: overview.severeCount ? `${overview.severeCount} severe events` : "No severe events",
      },
      {
        label: "Risk Score",
        value: overview.riskAvg !== null ? `${overview.riskAvg.toFixed(0)} / 100` : "--",
        sub: overview.riskAvg !== null ? "Higher = more operational risk" : "No data",
      },
    ];
  }, [overview]);

  const conditionDistribution = useMemo(() => {
    if (!overview) return [];
    const entries = Object.entries(overview.conditionCounts ?? {});
    const total = entries.reduce((acc, [, count]) => acc + count, 0) || 1;
    return entries.map(([name, value]) => ({ name, value: Math.round((value / total) * 100) }));
  }, [overview]);

  const trendData = useMemo(() => {
    if (!trends.length) return [];
    // Aggregate across locations per day for a simple fleet-level view.
    const byDay = new Map<string, { temp: number[]; wind: number[] }>();
    for (const p of trends) {
      const day = p.date.slice(0, 10);
      const entry = byDay.get(day) ?? { temp: [], wind: [] };
      if (p.tempAvgC !== null) entry.temp.push(p.tempAvgC);
      if (p.windAvgMs !== null) entry.wind.push(p.windAvgMs);
      byDay.set(day, entry);
    }
    return Array.from(byDay.entries())
      .map(([day, vals]) => ({
        label: day,
        temp: vals.temp.length ? average(vals.temp) : null,
        wind: vals.wind.length ? average(vals.wind) : null,
      }))
      .sort((a, b) => (a.label < b.label ? -1 : 1));
  }, [trends]);

  const severeEvents = useMemo(() => {
    return live.filter((s) => s.severe).map((s) => ({
      when: new Date(s.observedAt).toLocaleString(),
      location: s.locationName,
      detail: `${s.conditionCode} | Wind ${s.windSpeedMs ?? "-"} m/s | Precip ${s.precipMm ?? "-"} mm`,
    }));
  }, [live]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Overview Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Fleet-focused weather insight with trends, conditions, and operational risk.
          </p>
          {ingestMessage ? (
            <p className="text-muted-foreground mt-2 text-xs">{ingestMessage}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              void fetchDashboard();
            }}
            disabled={loading || ingesting || ingestingHistorical}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={triggerIngest} disabled={ingesting || ingestingHistorical}>
            {ingesting ? "Ingesting..." : "Ingest now"}
          </Button>
          <Button variant="outline" onClick={triggerIngestHistorical} disabled={ingesting || ingestingHistorical}>
            {ingestingHistorical ? "Ingesting..." : "Ingest last 10 days"}
          </Button>
          <Badge variant="outline">Live data</Badge>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.length ? (
          kpis.map((kpi) => (
            <Card key={kpi.label} className="gap-3">
              <CardHeader className="px-6 pb-0">
                <CardDescription>{kpi.label}</CardDescription>
                <CardTitle className="text-2xl">{kpi.value}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {kpi.sub}
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState message={loading ? "Loading metrics..." : "No data yet."} />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Trend: Temperature & Wind</CardTitle>
                <CardDescription>Daily snapshots across key lanes</CardDescription>
              </div>
              <Badge variant="outline">Past 7 days</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {trendData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: 4, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value ?? ""}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="temp" name="Temp (°C)" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="wind" name="Wind (m/s)" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message={loading ? "Loading trends..." : "No samples for trend window."} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Condition mix</CardTitle>
            <CardDescription>Share of observed conditions</CardDescription>
          </CardHeader>
          <CardContent className="grid h-72 grid-cols-[1fr_auto] items-center gap-4">
            {conditionDistribution.length ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conditionDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {conditionDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {conditionDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: pieColors[index % pieColors.length] }}
                      />
                      <span className="flex-1 text-foreground">{item.name}</span>
                      <span>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message={loading ? "Loading condition mix..." : "No condition data yet."} />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent severe conditions</CardTitle>
          <CardDescription>Flags triggered in the last few hours</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {severeEvents.length ? (
            severeEvents.map((event) => (
              <div key={event.when + event.location} className="flex items-center justify-between gap-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{event.location}</span>
                  <span className="text-sm text-muted-foreground">{event.detail}</span>
                </div>
                <Badge variant="destructive">{event.when}</Badge>
              </div>
            ))
          ) : (
            <EmptyState message={loading ? "Checking severe events..." : "No severe events in window."} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function average(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
