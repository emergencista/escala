-- CreateEnum
CREATE TYPE "AbsencePeriod" AS ENUM ('SD', 'SN');

-- AlterTable
ALTER TABLE "Absence"
ADD COLUMN "period" "AbsencePeriod" NOT NULL DEFAULT 'SD';