/*
  Warnings:

  - A unique constraint covering the columns `[portfolioId,stockId]` on the table `Holding` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Holding" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "MarketCache" ADD COLUMN     "lastError" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Holding_portfolioId_stockId_key" ON "Holding"("portfolioId", "stockId");
