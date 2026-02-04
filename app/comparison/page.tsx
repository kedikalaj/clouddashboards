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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ComparisonRow = {
  locationId: string;
  locationName: string;
  tempAvgC: number | null;
  windAvgMs: number | null;
  precipTotalMm: number | null;
  visibilityAvgKm: number | null;
  riskAvg: number | null;
  severeCount: number;
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

export default function ComparisonPage() {
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/analytics/comparison", { cache: "no-store" });
        const json = await parseJsonResponse<{ rows?: ComparisonRow[] }>(res);
        if (!cancelled) setRows(json.rows ?? []);
      } catch (error) {
        console.error("Failed to load comparison", error);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Location Comparison</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Compare key lanes and hubs by temperature, wind, precipitation, and risk.
          </p>
        </div>
        <Badge variant="outline">Live data</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cross-location weather profile</CardTitle>
          <CardDescription>Daily averages aggregated per location</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {rows.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ left: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="locationName" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }} />
                <Legend />
                <Bar dataKey="tempAvgC" name="Temp (°C)" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="windAvgMs" name="Wind (m/s)" fill="#f97316" radius={[6, 6, 0, 0]} />
                <Bar dataKey="precipTotalMm" name="Precip (mm)" fill="#4b5563" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message={loading ? "Loading comparison..." : "No comparison data."} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk and conditions table</CardTitle>
          <CardDescription>Use as a quick dispatch briefing</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Avg Temp</TableHead>
                  <TableHead>Avg Wind</TableHead>
                  <TableHead>Precip (window)</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Severe Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.locationId}>
                    <TableCell className="font-semibold">{row.locationName}</TableCell>
                    <TableCell>{row.tempAvgC !== null ? `${row.tempAvgC.toFixed(1)}°C` : "--"}</TableCell>
                    <TableCell>{row.windAvgMs !== null ? `${row.windAvgMs.toFixed(1)} m/s` : "--"}</TableCell>
                    <TableCell>{row.precipTotalMm !== null ? `${row.precipTotalMm.toFixed(1)} mm` : "--"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                        {row.riskAvg !== null ? row.riskAvg.toFixed(0) : "--"}
                        <span className="text-muted-foreground">/ 100</span>
                      </span>
                    </TableCell>
                    <TableCell>{row.severeCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message={loading ? "Loading table..." : "No locations available."} />
          )}
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
