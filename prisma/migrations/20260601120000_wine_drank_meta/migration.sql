ALTER TABLE "Wine" ADD COLUMN "drankAt" TIMESTAMP(3);
ALTER TABLE "Wine" ADD COLUMN "drankRating" DOUBLE PRECISION;
ALTER TABLE "Wine" ADD COLUMN "drankNotes" TEXT;

UPDATE "Wine" SET "drankAt" = "updatedAt" WHERE "drank" = true AND "drankAt" IS NULL;

CREATE INDEX "Wine_drank_drankAt_idx" ON "Wine"("drank", "drankAt" DESC);
