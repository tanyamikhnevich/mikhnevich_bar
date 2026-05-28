-- Guest wine list: visibility flag, bottle/glass prices (rename legacy guestPrice)
ALTER TABLE "Wine" ADD COLUMN IF NOT EXISTS "isGuestVisible" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Wine" RENAME COLUMN "guestPrice" TO "guestBottlePrice";

ALTER TABLE "Wine" ADD COLUMN IF NOT EXISTS "guestGlassPrice" INTEGER;
