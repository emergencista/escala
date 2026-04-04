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
    const { date, hours, period, observation } = await req.json();

    if (!date || !hours || !period) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plannedMakeup = await prisma.makeup.update({
      where: { id },
      data: {
        date: parseDateOnlyInput(date),
        hours,
        period,
        observation: observation || null,
        status: "PLANNED",
      },
    });

    return NextResponse.json(plannedMakeup);
  } catch (error) {
    console.error("Error updating planned makeup:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!canManageResidents(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const confirmedMakeup = await prisma.makeup.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    return NextResponse.json(confirmedMakeup);
  } catch (error) {
    console.error("Error confirming planned makeup:", error);
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
    await prisma.makeup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting planned makeup:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}