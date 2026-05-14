-- CreateEnum
CREATE TYPE "WineColor" AS ENUM ('red', 'white', 'rose');

-- CreateTable
CREATE TABLE "Wine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "producer" TEXT NOT NULL,
    "year" INTEGER,
    "country" TEXT,
    "countryCode" TEXT,
    "region" TEXT,
    "subregion" TEXT,
    "grape" TEXT,
    "purchasePrice" INTEGER,
    "originPrice" INTEGER,
    "israelPrice" INTEGER,
    "guestPrice" INTEGER,
    "purchaseDate" TIMESTAMP(3),
    "vivinoRating" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "color" "WineColor" NOT NULL,
    "drank" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Wine_drank_color_createdAt_idx" ON "Wine"("drank", "color", "createdAt");
