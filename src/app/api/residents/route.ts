import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const residents = await prisma.resident.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(residents);
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
