-- AlterTable: refund tracking for cancelled paid orders
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundId" TEXT;