-- AlterTable: guest order ownership token
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderToken" TEXT;

-- Unique constraint so guest order tokens cannot collide
CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderToken_key" ON "Order"("orderToken") WHERE "orderToken" IS NOT NULL;