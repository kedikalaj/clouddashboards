-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "locationType" TEXT NOT NULL DEFAULT 'CITY',
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WeatherSample" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "observedAt" DATETIME NOT NULL,
    "tempC" REAL,
    "windSpeedMs" REAL,
    "precipMm" REAL,
    "visibilityKm" REAL,
    "conditionCode" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeatherSample_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyAggregate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "tempMinC" REAL,
    "tempMaxC" REAL,
    "tempAvgC" REAL,
    "windAvgMs" REAL,
    "precipTotalMm" REAL,
    "visibilityAvgKm" REAL,
    "conditionCounts" JSONB,
    "riskScore" INTEGER,
    "severeFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyAggregate_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FetchLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "message" TEXT,
    "source" TEXT,
    CONSTRAINT "FetchLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WeatherSample_locationId_observedAt_idx" ON "WeatherSample"("locationId", "observedAt");

-- CreateIndex
CREATE INDEX "DailyAggregate_date_idx" ON "DailyAggregate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAggregate_locationId_date_key" ON "DailyAggregate"("locationId", "date");

-- CreateIndex
CREATE INDEX "FetchLog_locationId_fetchedAt_idx" ON "FetchLog"("locationId", "fetchedAt");
