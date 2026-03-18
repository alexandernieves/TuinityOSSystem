-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN     "product_lot_id" UUID;

-- CreateTable
CREATE TABLE "product_lots" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "purchase_receipt_line_id" UUID,
    "lot_number" TEXT NOT NULL,
    "expiration_date" TIMESTAMPTZ(6),
    "manufacturing_date" TIMESTAMPTZ(6),
    "received_quantity" DECIMAL(12,3) NOT NULL,
    "available_quantity" DECIMAL(12,3) NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_receipt_line_lots" (
    "id" UUID NOT NULL,
    "purchase_receipt_line_id" UUID NOT NULL,
    "product_lot_id" UUID,
    "lot_number" TEXT NOT NULL,
    "expiration_date" TIMESTAMPTZ(6),
    "manufacturing_date" TIMESTAMPTZ(6),
    "quantity_received" DECIMAL(12,3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "purchase_receipt_line_lots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_lots_product_id_idx" ON "product_lots"("product_id");

-- CreateIndex
CREATE INDEX "product_lots_warehouse_id_idx" ON "product_lots"("warehouse_id");

-- CreateIndex
CREATE INDEX "product_lots_expiration_date_idx" ON "product_lots"("expiration_date");

-- CreateIndex
CREATE INDEX "product_lots_is_active_idx" ON "product_lots"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "product_lots_warehouse_id_product_id_lot_number_expiration__key" ON "product_lots"("warehouse_id", "product_id", "lot_number", "expiration_date");

-- CreateIndex
CREATE INDEX "purchase_receipt_line_lots_purchase_receipt_line_id_idx" ON "purchase_receipt_line_lots"("purchase_receipt_line_id");

-- CreateIndex
CREATE INDEX "purchase_receipt_line_lots_product_lot_id_idx" ON "purchase_receipt_line_lots"("product_lot_id");

-- CreateIndex
CREATE INDEX "inventory_movements_product_lot_id_idx" ON "inventory_movements"("product_lot_id");

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_lot_id_fkey" FOREIGN KEY ("product_lot_id") REFERENCES "product_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_lots" ADD CONSTRAINT "product_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_lots" ADD CONSTRAINT "product_lots_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_lots" ADD CONSTRAINT "product_lots_purchase_receipt_line_id_fkey" FOREIGN KEY ("purchase_receipt_line_id") REFERENCES "purchase_receipt_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_receipt_line_lots" ADD CONSTRAINT "purchase_receipt_line_lots_purchase_receipt_line_id_fkey" FOREIGN KEY ("purchase_receipt_line_id") REFERENCES "purchase_receipt_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_receipt_line_lots" ADD CONSTRAINT "purchase_receipt_line_lots_product_lot_id_fkey" FOREIGN KEY ("product_lot_id") REFERENCES "product_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
