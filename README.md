# Cloud Weather Fleet Dashboard

**Cloud Computing and Business Course Project**

A comprehensive weather analytics and operational risk monitoring platform designed for fleet and logistics teams. This full-stack application provides real-time weather data ingestion, historical trend analysis, and location-based risk assessments to support data-driven decision-making in logistics operations.

## Overview

Cloud Weather Fleet Dashboard is a modern web application built with cutting-edge technologies that demonstrates cloud computing principles, real-time data processing, and business intelligence for the logistics industry. It aggregates weather data from multiple sources, performs advanced analytics, and presents actionable insights through interactive dashboards.

## Features

- **Weather Data Ingestion**: Automatic ingestion of weather data via Open-Meteo (default) or OpenWeatherMap APIs
- **Multi-Location Support**: Monitor weather across multiple fleet locations with unique geographic coordinates and timezones
- **Real-Time Dashboard**: Live weather monitoring with severe weather alerts and risk scoring
- **Analytics Engine**: Server-side processing with:
  - Overview KPIs (temperature, wind, precipitation, visibility averages)
  - Historical trend analysis
  - Cross-location weather comparison
  - Severe weather event tracking
- **Risk Scoring**: Intelligent risk assessment based on weather conditions for operational planning
- **Daily Aggregates**: Automated aggregation of hourly samples into daily statistics
- **Data Persistence**: SQLite database ready for PostgreSQL migration for production deployments

## Tech Stack

### Frontend
- **Next.js 16** (App Router) - React framework with SSR and API routes
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Pre-built, customizable components
- **Recharts** - Interactive data visualization
- **Radix UI** - Headless component primitives

### Backend & Data
- **Node.js API Routes** - Serverless backend functions
- **Prisma ORM** - Type-safe database access
- **SQLite** - Lightweight embedded database (easily migratable to PostgreSQL)
- **Zod** - Runtime type validation

### Development Tools
- **ESLint** - Code quality and consistency
- **TypeScript Compiler** - Static type checking
- **ts-node** - TypeScript execution for scripts

## Project Structure

```
clouddashboards/
├── app/                              # Next.js App Router
│   ├── page.tsx                     # Overview dashboard
│   ├── layout.tsx                   # Root layout
│   ├── globals.css                  # Global styles
│   ├── comparison/                  # Location comparison page
│   ├── live/                        # Live monitoring page
│   └── api/                         # Backend API routes
│       ├── analytics/               # Analytics endpoints
│       │   ├── overview/            # KPI metrics
│       │   ├── trends/              # Trend analysis
│       │   └── comparison/          # Multi-location comparison
│       ├── ingest/                  # Weather data ingestion
│       ├── live/                    # Real-time data endpoint
│       └── locations/               # Location management
├── components/                       # React components
│   └── ui/                          # Reusable UI components
├── lib/                             # Business logic & utilities
│   ├── analytics.ts                 # Analytics calculations
│   ├── ingest.ts                    # Weather data ingestion
│   ├── weather.ts                   # Weather logic & risk scoring
│   ├── prisma.ts                    # Database client
│   └── utils.ts                     # Helper functions
├── prisma/                          # Database schema & migrations
│   ├── schema.prisma                # Data models
│   ├── seed.ts                      # Database seeding script
│   └── migrations/                  # Database migrations
└── public/                          # Static assets
```

## Data Models

### Location
- Geographic locations monitored by the fleet
- Stores coordinates, timezone, and location type
- One-to-many relationship with weather samples and daily aggregates

### WeatherSample
- Individual hourly weather observations
- Fields: temperature, wind speed, precipitation, visibility, condition code
- Indexed by location and observation timestamp

### DailyAggregate
- Aggregated daily statistics computed from hourly samples
- Includes min/max/average metrics and risk scores
- Severe weather flag for operational alerts

### FetchLog
- Audit trail of weather data ingestion operations
- Tracks source, timestamp, and status of fetch operations

## Getting Started

### Prerequisites
- **Node.js 20+** (with npm)
- **Git** (optional, for cloning)

### Installation

1. **Clone or download the project**
   ```bash
   cd clouddashboards
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the project root:
   ```env
   # Database URL (SQLite example)
   DATABASE_URL="file:./prisma/dev.db"
   
   # Weather API (Optional - defaults to Open-Meteo)
   WEATHER_API_KEY="your_api_key_here"
   ```

4. **Initialize the database**
   ```bash
   npm run db:generate    # Generate Prisma client
   npm run db:migrate     # Run migrations
   npm run db:seed        # Seed sample data
   ```

### Running the Application

**Development Mode**
```bash
npm run dev
```
Visit `http://localhost:3000` in your browser.

**Production Build**
```bash
npm run build
npm start
```

## Usage

### Add a Location
1. Navigate to the dashboard
2. Use the API or database seeding to add location data
3. Data format: `{ name, latitude, longitude, timezone }`

### Ingest Weather Data
```bash
curl -X POST http://localhost:3000/api/ingest
```

Or for a specific location:
```bash
curl -X POST "http://localhost:3000/api/ingest?locationId=<location_id>"
```

### Access Dashboards

- **Overview** (`/`): KPIs, trends, condition breakdown
- **Location Comparison** (`/comparison`): Side-by-side weather metrics across locations
- **Live Monitor** (`/live`): Real-time weather with severe weather alerts

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ingest` | Ingest weather data for all or specific locations |
| GET | `/api/analytics/overview` | Get overview KPIs for specified window |
| GET | `/api/analytics/trends` | Get historical trend data |
| GET | `/api/analytics/comparison` | Compare weather across locations |
| GET | `/api/live` | Get real-time data with severe weather flags |
| GET | `/api/locations` | List all monitored locations |

## Database

### Migrations
The project includes automatic migration tracking:
```bash
npm run db:migrate     # Run pending migrations
npm run db:generate    # Regenerate Prisma client
npm run db:seed        # Execute seed script
```

### Seeding
Sample locations and data are provided in `prisma/seed.ts`. Modify to add your fleet locations.

## Deployment

### Cloud Platforms
- **Vercel** (recommended for Next.js)
  ```bash
  npm run build
  # Deploy to Vercel via CLI or GitHub integration
  ```
- **AWS**, **Azure**, **Google Cloud** (via Docker containerization)
- **Traditional Servers** (Node.js + database)

### Database Migration
For production, migrate from SQLite to PostgreSQL:
1. Update `datasource` in `schema.prisma`
2. Update `DATABASE_URL` in environment
3. Run `npm run db:migrate`

## Development

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

## Key Concepts & Architecture

### Risk Scoring
The application implements a risk scoring algorithm that evaluates weather conditions based on:
- Temperature extremes
- High wind speeds
- Precipitation levels
- Low visibility
- Severe weather conditions

### Server-Side Analytics
All analytics computations happen server-side using API routes, ensuring:
- Efficient data processing
- Secure business logic
- Reduced client-side computational load

### Real-Time Monitoring
Live endpoint provides current conditions with severe weather flags for operational decision-making.

## Learning Outcomes (Cloud Computing & Business)

This project demonstrates:
- **Cloud Architecture**: Serverless functions, scalable API design
- **Data Engineering**: Time-series data aggregation and analytics
- **Business Intelligence**: KPIs, trend analysis, risk scoring
- **Full-Stack Development**: Frontend, backend, and database integration
- **Real-Time Systems**: Live data monitoring and alerts
- **DevOps**: Database migrations, environment management

## Future Enhancements

- [ ] WebSocket integration for real-time updates
- [ ] Advanced ML-based risk prediction
- [ ] Weather alert notifications (email/SMS)
- [ ] Historical data export (CSV, Excel)
- [ ] Mobile app (React Native)
- [ ] Multi-tenant support for multiple fleet operators
- [ ] Integration with IoT sensors
- [ ] GraphQL API alternative

## Contributing

This is an academic project. For improvements or modifications:
1. Create a feature branch
2. Implement changes with TypeScript types
3. Run linting and tests
4. Submit for review

## License

Academic project - Cloud Computing and Business Course

## Support

For issues or questions about the project, refer to the documentation in each module's TypeScript files or the course materials.

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
