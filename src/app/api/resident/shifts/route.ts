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

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
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

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    });

    const candidateNames = [
      user?.name || "",
      emailToResidentName(user?.email || session.email),
      emailToResidentName(session.email),
    ].filter(Boolean);

    let resident = null;

    for (const candidate of candidateNames) {
      resident = await prisma.resident.findFirst({
        where: {
          name: {
            equals: candidate,
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

      if (resident) {
        break;
      }
    }

    if (!resident) {
      const residents = await prisma.resident.findMany({
        include: {
          absences: {
            orderBy: { date: "desc" },
          },
          makeups: {
            orderBy: { date: "desc" },
          },
        },
      });

      const normalizedCandidates = new Set(candidateNames.map(normalizeName));
      resident = residents.find((item) => normalizedCandidates.has(normalizeName(item.name))) || null;
    }

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
