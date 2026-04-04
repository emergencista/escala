import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageResidents } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    if (!canManageResidents(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [absences, makeups] = await Promise.all([
      prisma.absence.findMany({
        include: {
          resident: {
            select: { name: true, pgyLevel: true },
          },
        },
        orderBy: { date: "desc" },
      }),
      prisma.makeup.findMany({
        include: {
          resident: {
            select: { name: true, pgyLevel: true },
          },
        },
        orderBy: { date: "desc" },
      }),
    ]);

    const events = [
      ...absences.map((absence) => ({
        id: absence.id,
        date: absence.date.toISOString(),
        kind: "absence" as const,
        residentName: absence.resident.name,
        residentPgyLevel: absence.resident.pgyLevel,
        label: "FALTA",
        details: `${absence.location} · ${absence.period}${absence.reason ? ` · ${absence.reason}` : ""}`,
        hours: absence.hours,
      })),
      ...makeups
        .filter((makeup) => makeup.status === "PLANNED")
        .map((makeup) => ({
          id: makeup.id,
          date: makeup.date.toISOString(),
          kind: "planned" as const,
          residentName: makeup.resident.name,
          residentPgyLevel: makeup.resident.pgyLevel,
          label: "PREVISTA",
          details: `${makeup.period || "SD"}${makeup.observation ? ` · ${makeup.observation}` : ""}`,
          hours: makeup.hours,
        })),
      ...makeups
        .filter((makeup) => makeup.status === "CONFIRMED")
        .map((makeup) => ({
          id: makeup.id,
          date: makeup.date.toISOString(),
          kind: "confirmed" as const,
          residentName: makeup.resident.name,
          residentPgyLevel: makeup.resident.pgyLevel,
          label: "CONFIRMADA",
          details: `Carga horária reposta${makeup.period ? ` · ${makeup.period}` : ""}`,
          hours: makeup.hours,
        })),
    ].sort((left, right) => right.date.localeCompare(left.date));

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}