-- CreateTable
CREATE TABLE "EditorAuth" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EditorSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "rememberMe" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "EditorSession_tokenHash_key" ON "EditorSession"("tokenHash");

-- CreateIndex
CREATE INDEX "EditorSession_expiresAt_idx" ON "EditorSession"("expiresAt");

-- Seed initial password hash
INSERT INTO "EditorAuth" ("id", "passwordHash", "createdAt", "updatedAt")
VALUES (
  'default',
  'scrypt$16384$8$1$c5a06bc2e31c9bae3d2a7e8ca4ba51c0$75c6085dffd0a1b17ed2b922c5d02951a7eb3a94cd3a607984cccf905193c68c29ae3ba7b00677f8133516b4da8ab52a41082ee3f5a8668627ae7f92050e705f',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
