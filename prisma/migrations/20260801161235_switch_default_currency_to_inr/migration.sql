-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'inr';

-- Fix existing seed-generated orders (synthetic demo data only, no real payments).
UPDATE "Order" SET currency = 'inr' WHERE currency = 'usd';
