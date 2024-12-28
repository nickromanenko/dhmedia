/*
  Warnings:

  - You are about to drop the `assistants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "assistants";

-- CreateTable
CREATE TABLE "bots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "model" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "kb_id" TEXT,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bots_pkey" PRIMARY KEY ("id")
);
