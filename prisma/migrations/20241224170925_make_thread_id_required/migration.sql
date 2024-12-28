/*
  Warnings:

  - Made the column `thread_id` on table `messages` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "thread_id" SET NOT NULL;
