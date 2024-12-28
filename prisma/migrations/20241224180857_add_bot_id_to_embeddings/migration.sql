/*
  Warnings:

  - Added the required column `bot_id` to the `embeddings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "embeddings" ADD COLUMN     "bot_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "embeddings_bot_id_idx" ON "embeddings"("bot_id");

-- AddForeignKey
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
