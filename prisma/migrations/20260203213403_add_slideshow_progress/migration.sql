-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Slideshow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "defaultAutoSlideMs" INTEGER NOT NULL DEFAULT 5000,
    "revealTransition" TEXT NOT NULL DEFAULT 'slide',
    "loop" BOOLEAN NOT NULL DEFAULT true,
    "controls" BOOLEAN NOT NULL DEFAULT true,
    "progress" BOOLEAN NOT NULL DEFAULT false,
    "defaultScreenKey" TEXT NOT NULL DEFAULT 'main',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Slideshow" ("controls", "createdAt", "defaultAutoSlideMs", "defaultScreenKey", "id", "isActive", "loop", "name", "revealTransition", "updatedAt") SELECT "controls", "createdAt", "defaultAutoSlideMs", "defaultScreenKey", "id", "isActive", "loop", "name", "revealTransition", "updatedAt" FROM "Slideshow";
DROP TABLE "Slideshow";
ALTER TABLE "new_Slideshow" RENAME TO "Slideshow";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
