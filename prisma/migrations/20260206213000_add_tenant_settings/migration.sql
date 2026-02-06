-- CreateTable
CREATE TABLE "TenantSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "googleFontsApiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Seed singleton settings row
INSERT INTO "TenantSettings" ("id", "googleFontsApiKey", "createdAt", "updatedAt")
VALUES ('default', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
