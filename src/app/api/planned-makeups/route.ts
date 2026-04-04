import { getSession } from "@/lib/auth";
import { parseDateOnlyInput } from "@/lib/date";
import prisma from "@/lib/prisma";
import { notifyPlannedMakeupCreated } from "@/lib/telegram";
import { canManageResidents } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canManageResidents(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { residentId, date, hours, period, observation } = await req.json();

    if (!residentId || !date || !hours || !period) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plannedMakeup = await prisma.makeup.create({
      data: {
        residentId,
        date: parseDateOnlyInput(date),
        hours,
        period,
        observation: observation || null,
        status: "PLANNED",
      },
      include: {
        resident: {
          select: {
            name: true,
            pgyLevel: true,
          },
        },
      },
    });

    try {
      await notifyPlannedMakeupCreated({
        residentName: plannedMakeup.resident.name,
        residentPgyLevel: plannedMakeup.resident.pgyLevel,
        date,
        hours,
        period,
        createdByName: session.email,
      });
    } catch (notificationError) {
      console.error("Telegram planned makeup notification error:", notificationError);
    }

    return NextResponse.json(plannedMakeup);
  } catch (error) {
    console.error("Error creating planned makeup:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const residentId = req.nextUrl.searchParams.get("residentId");
    if (!residentId) {
      return NextResponse.json({ error: "residentId is required" }, { status: 400 });
    }

    const plannedMakeups = await prisma.makeup.findMany({
      where: { residentId, status: "PLANNED" },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(plannedMakeups);
  } catch (error) {
    console.error("Error fetching planned makeups:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}