-- AlterTable: привязка вина к пользователю (nullable, чтобы существующие строки мигрировали без потерь)
ALTER TABLE "Wine" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "Wine_userId_idx" ON "Wine"("userId");

-- CreateIndex
CREATE INDEX "Wine_userId_drank_color_createdAt_idx" ON "Wine"("userId", "drank", "color", "createdAt");

-- AddForeignKey
ALTER TABLE "Wine" ADD CONSTRAINT "Wine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
