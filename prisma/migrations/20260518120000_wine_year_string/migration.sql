-- AlterTable: год — строка (число или "N.V." для безвинтажных)
ALTER TABLE "Wine" ALTER COLUMN "year" SET DATA TYPE TEXT USING (
  CASE
    WHEN "year" IS NULL THEN NULL
    ELSE "year"::text
  END
);
