-- CreateEnum
CREATE TYPE "ApprovalRequestType" AS ENUM ('QUOTATION', 'SALES_ORDER', 'INVOICE_CANCELLATION', 'INVENTORY_ADJUSTMENT', 'PRICE_EXCEPTION', 'RECEIPT_CANCELLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalDecisionType" AS ENUM ('APPROVE', 'REJECT', 'CANCEL');

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" UUID NOT NULL,
    "type" "ApprovalRequestType" NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "requested_by_user_id" UUID NOT NULL,
    "assigned_to_user_id" UUID,
    "status" "ApprovalRequestStatus" NOT NULL,
    "reason" TEXT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_decisions" (
    "id" UUID NOT NULL,
    "approval_request_id" UUID NOT NULL,
    "decided_by_user_id" UUID NOT NULL,
    "decision" "ApprovalDecisionType" NOT NULL,
    "reason" TEXT,
    "decided_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "approval_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_requests_type_idx" ON "approval_requests"("type");

-- CreateIndex
CREATE INDEX "approval_requests_reference_type_reference_id_idx" ON "approval_requests"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "approval_requests_requested_by_user_id_idx" ON "approval_requests"("requested_by_user_id");

-- CreateIndex
CREATE INDEX "approval_requests_assigned_to_user_id_idx" ON "approval_requests"("assigned_to_user_id");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

-- CreateIndex
CREATE INDEX "approval_requests_requested_at_idx" ON "approval_requests"("requested_at");

-- CreateIndex
CREATE INDEX "approval_decisions_approval_request_id_idx" ON "approval_decisions"("approval_request_id");

-- CreateIndex
CREATE INDEX "approval_decisions_decided_by_user_id_idx" ON "approval_decisions"("decided_by_user_id");

-- CreateIndex
CREATE INDEX "approval_decisions_decision_idx" ON "approval_decisions"("decision");

-- CreateIndex
CREATE INDEX "approval_decisions_decided_at_idx" ON "approval_decisions"("decided_at");

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
