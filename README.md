## Cloud Weather Fleet Dashboard

Weather analytics and operational risk monitoring for fleet and logistics teams. Built with Next.js (App Router), Prisma, SQLite, Tailwind + shadcn/ui, and Recharts.

### Features
- Weather ingestion via Open-Meteo (default) or OpenWeatherMap
- Historical storage with Prisma/SQLite; ready to migrate to PostgreSQL later
- Server-side analytics: overview KPIs, trends, cross-location comparison, live window with severe flags
- Dashboards: Overview, Location Comparison, Live Monitor

### Tech Stack
- Next.js App Router, React 19
- Tailwind CSS + shadcn/ui components
- Prisma ORM with SQLite (file db in repo path)
- Recharts for charts

### Prerequisites
- Node 20+
- npm (comes with Node)

### Setup
1) Install deps
```bash
npm install
```
2) Create env file
```bash
cp .env.local.example .env.local
```
Edit `.env.local`:
- `DATABASE_URL`: `file:./prisma/db.sqlite` (default)
- `WEATHER_PROVIDER`: `open-meteo` or `openweathermap`
- `WEATHER_API_KEY`: required only for OpenWeatherMap

3) Database migrate + seed
```bash
npm run db:migrate
npm run db:seed
```
Seed adds example locations (ports/routes: LA, NY, Rotterdam, Singapore, Pacific Northern Route, Gulf Coast Corridor).

4) Run dev server
```bash
npm run dev
# open http://localhost:3000
```

### Data Model (Prisma)
- `Location`: name, type, lat/lon, timezone
- `WeatherSample`: raw observations with condition code and source
- `DailyAggregate`: per-location per-day rollups, risk score, condition counts
- `FetchLog`: ingestion audit trail

### Ingestion
- Endpoint: `POST /api/ingest?locationId=...` (optional locationId to limit scope)
- Uses provider from env; stores sample + fetch log per location
- For local testing you can call from a REST client or `curl`:
```bash
curl -X POST http://localhost:3000/api/ingest
```

### Analytics APIs
- `GET /api/analytics/overview?hours=24` — window KPIs (avg temp/wind, precip, risk, conditions, severe count)
- `GET /api/analytics/trends?days=7` — per-day aggregates per location
- `GET /api/analytics/comparison?days=3` — cross-location summary
- `GET /api/live?hours=6` — latest sample per location with severe/risk

### Dashboards (App Router pages)
- `/` Overview: KPI cards, fleet trend (temp/wind), condition mix pie, severe events list
- `/comparison` Location Comparison: bar chart and sortable table with risk/severe counts
- `/live` Live Monitor: auto-refresh recent observations with severe flags

### Deployment (Vercel)
- Use the same `.env` values in Vercel dashboard (add `DATABASE_URL`, `WEATHER_PROVIDER`, `WEATHER_API_KEY` if needed)
- For SQLite, use Vercel Blob/Edge Config or switch to Postgres: update `DATABASE_URL` and run `prisma migrate deploy`
- Set build command `npm run build`, output is handled by Next.js

### Notes
- In dev, Prisma logs errors/warnings only. Adjust in `lib/prisma.ts` if you want query logging.
- If using OpenWeatherMap, ensure `WEATHER_API_KEY` is set; otherwise provider defaults to Open-Meteo.
