-- Support non-vintage labels (e.g. N.V.) in year column
ALTER TABLE "Wine" ALTER COLUMN "year" TYPE TEXT USING (
  CASE
    WHEN "year" IS NULL THEN NULL
    ELSE "year"::text
  END
);
