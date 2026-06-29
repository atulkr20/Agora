-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ORDER_PLACED', 'ORDER_PARTIAL', 'ORDER_FILLED', 'ORDER_CANCELLED');

-- CreateTable
CREATE TABLE "OrdeeEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrdeeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "buyOrderId" TEXT NOT NULL,
    "sellOrderId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrdeeEvent_symbol_idx" ON "OrdeeEvent"("symbol");

-- CreateIndex
CREATE INDEX "OrdeeEvent_orderId_idx" ON "OrdeeEvent"("orderId");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");
