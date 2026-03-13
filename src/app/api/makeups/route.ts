import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { residentId, date, hours } = await req.json();

    if (!residentId || !date || !hours) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const makeup = await prisma.makeup.create({
      data: {
        residentId,
        date: new Date(date),
        hours,
      },
    });

    return NextResponse.json(makeup);
  } catch (error) {
    console.error("Error creating makeup:", error);
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

    const makeups = await prisma.makeup.findMany({
      where: { residentId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(makeups);
  } catch (error) {
    console.error("Error fetching makeups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
