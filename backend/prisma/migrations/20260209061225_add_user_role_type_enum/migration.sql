-- CreateEnum
CREATE TYPE "UserRoleType" AS ENUM ('CLIENT', 'MEMBER', 'ADMIN', 'OWNER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRoleType" NOT NULL DEFAULT 'CLIENT';
