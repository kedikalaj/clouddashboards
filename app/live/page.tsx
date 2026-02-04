"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T & { error?: string }) : ({} as T & { error?: string });

  if (!res.ok) {
    const message = typeof data?.error === "string" ? data.error : res.statusText || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export default function LivePage() {
  const [samples, setSamples] = useState<LiveSample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/live?hours=6", { cache: "no-store" });
        const json = await parseJsonResponse<{ samples?: LiveSample[] }>(res);
        if (!cancelled) setSamples(json.samples ?? []);
      } catch (error) {
        console.error("Failed to load live window", error);
        if (!cancelled) setSamples([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Live Weather Monitor</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Near real-time window for fleet hubs. Auto-refresh recommended every 60 seconds.
          </p>
        </div>
        <Badge variant="outline">Live window</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent observations</CardTitle>
          <CardDescription>Last 3–6 hours per location</CardDescription>
        </CardHeader>
        <CardContent>
          {samples.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Observed</TableHead>
                  <TableHead>Temp</TableHead>
                  <TableHead>Wind</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samples.map((row) => (
                  <TableRow key={row.locationId}>
                    <TableCell className="font-semibold">{row.locationName}</TableCell>
                    <TableCell>{new Date(row.observedAt).toLocaleString()}</TableCell>
                    <TableCell>{row.tempC !== null ? `${row.tempC.toFixed(1)}°C` : "--"}</TableCell>
                    <TableCell>{row.windSpeedMs !== null ? `${row.windSpeedMs.toFixed(1)} m/s` : "--"}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      {row.conditionCode}
                      {row.severe ? <Badge variant="destructive">Severe</Badge> : null}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                        {row.risk}
                        <span className="text-muted-foreground">/ 100</span>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message={loading ? "Loading live window..." : "No recent observations."} />
          )}
          <p className="text-muted-foreground mt-4 text-sm">
            This view refreshes every 60s from the live window API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
