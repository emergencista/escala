import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const residentId = req.nextUrl.searchParams.get("residentId");
    if (!residentId) {
      return NextResponse.json(
        { error: "residentId is required" },
        { status: 400 }
      );
    }

    // Fetch resident
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Resident not found" },
        { status: 404 }
      );
    }

    // Fetch all absences and makeups
    const [absences, makeups] = await Promise.all([
      prisma.absence.findMany({
        where: { residentId },
        orderBy: { date: "desc" },
      }),
      prisma.makeup.findMany({
        where: { residentId },
        orderBy: { date: "desc" },
      }),
    ]);

    // Calculate totals
    const totalAbsenceHours = absences.reduce((sum, a) => sum + a.hours, 0);
    const totalMakeupHours = makeups.reduce((sum, m) => sum + m.hours, 0);
    const balanceHours = totalAbsenceHours - totalMakeupHours;

    return NextResponse.json({
      resident,
      absences,
      makeups,
      totalAbsenceHours,
      totalMakeupHours,
      balanceHours,
    });
  } catch (error) {
    console.error("Error fetching resident summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
