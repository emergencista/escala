import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { residentId, date, hours, type, reason } = await req.json();

    if (!residentId || !date || !hours || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const absence = await prisma.absence.create({
      data: {
        residentId,
        date: new Date(date),
        hours,
        type,
        reason: reason || null,
        createdById: session.userId,
      },
    });

    return NextResponse.json(absence);
  } catch (error) {
    console.error("Error creating absence:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "residentId is required" },
        { status: 400 }
      );
    }

    const absences = await prisma.absence.findMany({
      where: { residentId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(absences);
  } catch (error) {
    console.error("Error fetching absences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
