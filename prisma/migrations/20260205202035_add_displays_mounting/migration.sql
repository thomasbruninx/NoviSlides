-- CreateTable
CREATE TABLE "Display" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "mountedSlideshowId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Display_mountedSlideshowId_fkey" FOREIGN KEY ("mountedSlideshowId") REFERENCES "Slideshow" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Display_name_key" ON "Display"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Display_mountedSlideshowId_key" ON "Display"("mountedSlideshowId");
