-- CreateTable
CREATE TABLE "crawler_links" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawler_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crawler_links_bot_id_idx" ON "crawler_links"("bot_id");

-- AddForeignKey
ALTER TABLE "crawler_links" ADD CONSTRAINT "crawler_links_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
