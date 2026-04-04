import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const residents = await prisma.resident.findMany({
    include: {
      absences: {
        select: {
          hours: true,
        },
      },
      makeups: {
        select: {
          hours: true,
          status: true,
        },
      },
    },
    orderBy: [{ pgyLevel: "desc" }, { name: "asc" }],
  });

  const summary = residents.map((resident) => {
    const totalAbsenceHours = resident.absences.reduce((sum, absence) => sum + absence.hours, 0);
    const confirmedMakeups = resident.makeups.filter((makeup) => makeup.status === "CONFIRMED");
    const totalMakeupHours = confirmedMakeups.reduce((sum, makeup) => sum + makeup.hours, 0);

    return {
      id: resident.id,
      name: resident.name,
      pgyLevel: resident.pgyLevel,
      totalAbsenceHours,
      totalMakeupHours,
      balanceHours: totalAbsenceHours - totalMakeupHours,
      absenceCount: resident.absences.length,
      makeupCount: confirmedMakeups.length,
      login: null,
      password: null,
    };
  });

  return NextResponse.json(summary);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const pgyLevel = Number(body.pgyLevel);

  if (!name) {
    return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });
  }
  if (!Number.isInteger(pgyLevel) || pgyLevel < 1) {
    return NextResponse.json({ error: "Informe um ano válido de residência." }, { status: 400 });
  }

  const resident = await prisma.resident.create({
    data: {
      name,
      pgyLevel,
    },
  });

  return NextResponse.json(resident, { status: 201 });
}
