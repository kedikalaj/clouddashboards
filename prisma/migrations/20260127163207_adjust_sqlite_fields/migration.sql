-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyAggregate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "tempMinC" REAL,
    "tempMaxC" REAL,
    "tempAvgC" REAL,
    "windAvgMs" REAL,
    "precipTotalMm" REAL,
    "visibilityAvgKm" REAL,
    "conditionCounts" TEXT,
    "riskScore" INTEGER,
    "severeFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyAggregate_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyAggregate" ("conditionCounts", "createdAt", "date", "id", "locationId", "precipTotalMm", "riskScore", "severeFlag", "tempAvgC", "tempMaxC", "tempMinC", "visibilityAvgKm", "windAvgMs") SELECT "conditionCounts", "createdAt", "date", "id", "locationId", "precipTotalMm", "riskScore", "severeFlag", "tempAvgC", "tempMaxC", "tempMinC", "visibilityAvgKm", "windAvgMs" FROM "DailyAggregate";
DROP TABLE "DailyAggregate";
ALTER TABLE "new_DailyAggregate" RENAME TO "DailyAggregate";
CREATE INDEX "DailyAggregate_date_idx" ON "DailyAggregate"("date");
CREATE UNIQUE INDEX "DailyAggregate_locationId_date_key" ON "DailyAggregate"("locationId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
