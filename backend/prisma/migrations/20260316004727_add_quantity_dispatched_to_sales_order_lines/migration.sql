-- AlterTable
ALTER TABLE "sales_order_lines" ADD COLUMN     "quantity_dispatched" DECIMAL(12,3) NOT NULL DEFAULT 0;
