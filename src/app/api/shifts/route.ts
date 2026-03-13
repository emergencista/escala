import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getShiftDate() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function currentShiftType(date = new Date()) {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? "DIURNO" : "NOTURNO";
}

export async function GET() {
  const today = getShiftDate();
  const shiftType = currentShiftType();

  // Return empty shifts array - system now uses absence/makeup tracking instead
  const shifts: any[] = [];

  return NextResponse.json({ shifts, shiftType, date: today.toISOString() });
}

export async function POST(request: Request) {
  // Shift updates no longer supported - use /api/absences instead
  return NextResponse.json(
    { message: "Use /api/absences for recording absences instead" },
    { status: 200 }
  );
}
