-- CreateTable
CREATE TABLE "Slideshow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "defaultAutoSlideMs" INTEGER NOT NULL DEFAULT 5000,
    "revealTransition" TEXT NOT NULL DEFAULT 'slide',
    "loop" BOOLEAN NOT NULL DEFAULT true,
    "controls" BOOLEAN NOT NULL DEFAULT true,
    "defaultScreenKey" TEXT NOT NULL DEFAULT 'main',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Screen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slideshowId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Screen_slideshowId_fkey" FOREIGN KEY ("slideshowId") REFERENCES "Slideshow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Slide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "screenId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" TEXT,
    "autoSlideMsOverride" INTEGER,
    "backgroundColor" TEXT,
    "backgroundImagePath" TEXT,
    "transitionOverride" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Slide_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SlideElement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slideId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "width" REAL NOT NULL,
    "height" REAL NOT NULL,
    "rotation" REAL NOT NULL DEFAULT 0,
    "opacity" REAL NOT NULL DEFAULT 1,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "animation" TEXT NOT NULL DEFAULT 'none',
    "dataJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SlideElement_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "Slide" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Screen_slideshowId_key_key" ON "Screen"("slideshowId", "key");

-- CreateIndex
CREATE INDEX "Slide_screenId_idx" ON "Slide"("screenId");

-- CreateIndex
CREATE INDEX "SlideElement_slideId_idx" ON "SlideElement"("slideId");
