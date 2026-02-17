/*
  Warnings:

  - You are about to drop the column `totalLine` on the `SaleItem` table. All the data in the column will be lost.
  - Added the required column `total` to the `SaleItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SaleStatus" ADD VALUE 'QUOTE';
ALTER TYPE "SaleStatus" ADD VALUE 'APPROVED_QUOTE';
ALTER TYPE "SaleStatus" ADD VALUE 'PENDING';
ALTER TYPE "SaleStatus" ADD VALUE 'APPROVED_ORDER';
ALTER TYPE "SaleStatus" ADD VALUE 'PACKING';
ALTER TYPE "SaleStatus" ADD VALUE 'PARTIAL';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "lastCifCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "lastFobCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "unitsPerBox" INTEGER DEFAULT 1,
ADD COLUMN     "volume" DECIMAL(10,4),
ADD COLUMN     "weight" DECIMAL(10,4),
ADD COLUMN     "weightedAvgCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
ALTER COLUMN "codigoArancelario" DROP NOT NULL,
ALTER COLUMN "paisOrigen" DROP NOT NULL,
ALTER COLUMN "price_a" SET DEFAULT 0,
ALTER COLUMN "price_b" SET DEFAULT 0,
ALTER COLUMN "price_c" SET DEFAULT 0,
ALTER COLUMN "price_d" SET DEFAULT 0,
ALTER COLUMN "price_e" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "quoteNumber" TEXT,
ADD COLUMN     "validUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "totalLine",
ADD COLUMN     "quantityPacked" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total" DECIMAL(18,2) NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "discountAmount" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dispatchDate" TIMESTAMP(3),
    "destination" TEXT,
    "dmcNumber" TEXT,
    "blNumber" TEXT,
    "bookingNumber" TEXT,
    "containerNumber" TEXT,
    "sealNumber" TEXT,
    "carrierName" TEXT,
    "driverName" TEXT,
    "plateNumber" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "tariffCode" TEXT,
    "weight" DECIMAL(10,4),
    "volume" DECIMAL(10,4),

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shipment_tenantId_idx" ON "Shipment"("tenantId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_dmcNumber_idx" ON "Shipment"("dmcNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_tenantId_shipmentNumber_key" ON "Shipment"("tenantId", "shipmentNumber");

-- CreateIndex
CREATE INDEX "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentItem_productId_idx" ON "ShipmentItem"("productId");

-- CreateIndex
CREATE INDEX "ShipmentItem_saleItemId_idx" ON "ShipmentItem"("saleItemId");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
