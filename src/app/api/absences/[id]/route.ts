import { getSession } from "@/lib/auth";
import { parseDateOnlyInput } from "@/lib/date";
import { canManageResidents } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!canManageResidents(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { date, hours, type, reason, location, period, observation } = await req.json();

    if (!date || !hours || !type || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const absence = await prisma.absence.update({
      where: { id },
      data: {
        date: parseDateOnlyInput(date),
        hours,
        location,
        period: period || "SD",
        type,
        reason: reason || null,
        observation: observation || null,
      },
    });

    return NextResponse.json(absence);
  } catch (error) {
    console.error("Error updating absence:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!canManageResidents(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await prisma.absence.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting absence:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}