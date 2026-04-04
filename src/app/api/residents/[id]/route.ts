import { getSession } from "@/lib/auth";
import { canManageResidents } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { normalizeResidentKey } from "@/lib/residentCredentials";
import bcrypt from "bcryptjs";
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
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const pgyLevel = Number(body.pgyLevel);
    const login = typeof body.login === "string" ? body.login.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });
    }

    if (!Number.isInteger(pgyLevel) || pgyLevel < 1) {
      return NextResponse.json({ error: "Informe um ano válido de residência." }, { status: 400 });
    }

    if (!login || !/^[a-z0-9.]+$/.test(login)) {
      return NextResponse.json(
        { error: "Informe um login válido com letras, números e ponto." },
        { status: 400 }
      );
    }

    const resident = await prisma.resident.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!resident) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const targetEmail = `${login}@escala.local`;
    const residentUsers = await prisma.user.findMany({
      where: { role: "RESIDENT" },
      select: { id: true, name: true, email: true },
    });

    const matchedUser = residentUsers.find(
      (user) => normalizeResidentKey(user.name) === normalizeResidentKey(resident.name)
    );

    const existingLoginOwner = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true },
    });

    if (existingLoginOwner && existingLoginOwner.id !== matchedUser?.id) {
      return NextResponse.json({ error: "Esse login já está em uso." }, { status: 409 });
    }

    await prisma.resident.update({
      where: { id },
      data: {
        name,
        pgyLevel,
      },
    });

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    await prisma.user.upsert({
      where: { email: matchedUser?.email || targetEmail },
      update: {
        email: targetEmail,
        name,
        role: "RESIDENT",
        ...(passwordHash ? { password: passwordHash } : {}),
      },
      create: {
        email: targetEmail,
        name,
        role: "RESIDENT",
        password: passwordHash || (await bcrypt.hash("R123", 10)),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating resident:", error);
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

    const resident = await prisma.resident.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!resident) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    await prisma.resident.delete({ where: { id } });

    const residentUsers = await prisma.user.findMany({
      where: { role: "RESIDENT" },
      select: { id: true, name: true },
    });

    const matchedUser = residentUsers.find(
      (user) => normalizeResidentKey(user.name) === normalizeResidentKey(resident.name)
    );

    if (matchedUser) {
      await prisma.user.delete({ where: { id: matchedUser.id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resident:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
