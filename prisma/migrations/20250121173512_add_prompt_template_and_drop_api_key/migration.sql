/*
  Warnings:

  - You are about to drop the column `api_key` on the `bots` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bots" DROP COLUMN "api_key",
ADD COLUMN     "prompt_template" TEXT;
