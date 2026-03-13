-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('DIURNO', 'NOTURNO');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('ESCALADO', 'PRESENTE', 'FALTA', 'FALTA_JUSTIFICADA');

-- CreateTable
CREATE TABLE "Preceptor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Preceptor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pgyLevel" INTEGER NOT NULL,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "ShiftType" NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'ESCALADO',
    "verifiedById" TEXT,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Preceptor_email_key" ON "Preceptor"("email");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "Preceptor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
