-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "authorizedAt" TIMESTAMP(3),
ADD COLUMN     "authorizedBy" TEXT,
ADD COLUMN     "notes" TEXT;
