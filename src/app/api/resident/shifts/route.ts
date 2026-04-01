import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper to convert email to resident name format
function emailToResidentName(email: string): string {
  const [namePart] = email.split("@");
  return namePart
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "RESIDENT") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Convert email to resident name (e.g., maria.carolina@escala.local -> Maria Carolina)
    const residentName = emailToResidentName(session.email);

    // Find resident by matching name
    const resident = await prisma.resident.findFirst({
      where: {
        name: {
          equals: residentName,
          mode: "insensitive",
        },
      },
      include: {
        absences: {
          orderBy: { date: "desc" },
        },
        makeups: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Resident not found" },
        { status: 404 }
      );
    }

    // Calculate totals
    const totalAbsenceHours = resident.absences.reduce(
      (sum: number, a: { hours: number }) => sum + a.hours,
      0
    );
    const totalMakeupHours = resident.makeups.reduce(
      (sum: number, m: { hours: number }) => sum + m.hours,
      0
    );
    const balanceHours = totalAbsenceHours - totalMakeupHours;

    return NextResponse.json({
      name: resident.name,
      pgyLevel: resident.pgyLevel,
      absences: resident.absences,
      makeups: resident.makeups,
      totalAbsenceHours,
      totalMakeupHours,
      balanceHours,
    });
  } catch (error) {
    console.error("Error fetching resident shifts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
