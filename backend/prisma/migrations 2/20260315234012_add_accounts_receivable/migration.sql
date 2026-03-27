-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReceiptMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CHECK', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountsReceivableEntryType" AS ENUM ('INVOICE_CHARGE', 'PAYMENT_APPLICATION', 'ADJUSTMENT', 'CREDIT_NOTE', 'DEBIT_NOTE');

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "receipt_date" TIMESTAMPTZ(6) NOT NULL,
    "method" "ReceiptMethod" NOT NULL,
    "status" "ReceiptStatus" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_applications" (
    "id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "applied_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "receipt_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable_entries" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "invoice_id" UUID,
    "receipt_id" UUID,
    "entryType" "AccountsReceivableEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance_after" DECIMAL(12,2),
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "notes" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "accounts_receivable_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receipts_number_key" ON "receipts"("number");

-- CreateIndex
CREATE INDEX "receipts_number_idx" ON "receipts"("number");

-- CreateIndex
CREATE INDEX "receipts_customer_id_idx" ON "receipts"("customer_id");

-- CreateIndex
CREATE INDEX "receipts_status_idx" ON "receipts"("status");

-- CreateIndex
CREATE INDEX "receipts_receipt_date_idx" ON "receipts"("receipt_date");

-- CreateIndex
CREATE INDEX "receipt_applications_receipt_id_idx" ON "receipt_applications"("receipt_id");

-- CreateIndex
CREATE INDEX "receipt_applications_invoice_id_idx" ON "receipt_applications"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_applications_receipt_id_invoice_id_key" ON "receipt_applications"("receipt_id", "invoice_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_entries_customer_id_idx" ON "accounts_receivable_entries"("customer_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_entries_invoice_id_idx" ON "accounts_receivable_entries"("invoice_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_entries_receipt_id_idx" ON "accounts_receivable_entries"("receipt_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_entries_entryType_idx" ON "accounts_receivable_entries"("entryType");

-- CreateIndex
CREATE INDEX "accounts_receivable_entries_occurred_at_idx" ON "accounts_receivable_entries"("occurred_at");

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_applications" ADD CONSTRAINT "receipt_applications_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_applications" ADD CONSTRAINT "receipt_applications_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_entries" ADD CONSTRAINT "accounts_receivable_entries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_entries" ADD CONSTRAINT "accounts_receivable_entries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_entries" ADD CONSTRAINT "accounts_receivable_entries_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_entries" ADD CONSTRAINT "accounts_receivable_entries_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
