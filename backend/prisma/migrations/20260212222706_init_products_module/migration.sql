/*
  Warnings:

  - You are about to drop the column `category` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `minStock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.
  - Added the required column `codigoArancelario` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paisOrigen` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_a` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_b` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_c` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_d` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_e` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Product_category_idx";

-- DropIndex
DROP INDEX "Product_isActive_idx";

-- DropIndex
DROP INDEX "Product_sku_key";

-- DropIndex
DROP INDEX "Product_tenantId_sku_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
DROP COLUMN "cost",
DROP COLUMN "isActive",
DROP COLUMN "minStock",
DROP COLUMN "name",
DROP COLUMN "price",
DROP COLUMN "sku",
DROP COLUMN "stock",
ADD COLUMN     "codigoArancelario" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "description_es" TEXT,
ADD COLUMN     "description_pt" TEXT,
ADD COLUMN     "paisOrigen" TEXT NOT NULL,
ADD COLUMN     "price_a" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "price_b" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "price_c" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "price_d" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "price_e" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "updatedBy" TEXT,
ALTER COLUMN "description" SET NOT NULL;

-- CreateTable
CREATE TABLE "ProductBarcode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,

    CONSTRAINT "ProductBarcode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductBarcode_productId_idx" ON "ProductBarcode"("productId");

-- CreateIndex
CREATE INDEX "ProductBarcode_tenantId_idx" ON "ProductBarcode"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBarcode_tenantId_barcode_key" ON "ProductBarcode"("tenantId", "barcode");

-- CreateIndex
CREATE INDEX "Product_description_idx" ON "Product"("description");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
