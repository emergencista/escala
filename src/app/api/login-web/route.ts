import { signToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function findUserByLoginIdentifier(identifier: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  const exactEmail = normalizedIdentifier.includes("@")
    ? normalizedIdentifier
    : `${normalizedIdentifier}@escala.local`;

  const exactMatch = await prisma.user.findUnique({
    where: { email: exactEmail },
  });

  if (exactMatch) {
    return exactMatch;
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  const normalizedLookup = stripAccents(normalizedIdentifier.split("@")[0]);

  return (
    users.find((user) => {
      const localPart = user.email.split("@")[0].toLowerCase();
      return stripAccents(localPart) === normalizedLookup;
    }) ?? null
  );
}

function buildRedirectResponse(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: location,
    },
  });
}

function buildLoginPath(error?: string) {
  const params = new URLSearchParams();
  if (error) {
    params.set("error", error);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = normalizeIdentifier(String(formData.get("email") || ""));
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      return buildRedirectResponse(buildLoginPath("Email e senha são obrigatórios"));
    }

    const user = await findUserByLoginIdentifier(email);

    if (!user) {
      return buildRedirectResponse(buildLoginPath("Email ou senha inválidos"));
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return buildRedirectResponse(buildLoginPath("Email ou senha inválidos"));
    }

    const response = buildRedirectResponse(user.role === "RESIDENT" ? "/resident/shifts" : "/");

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login web error:", error);
    return buildRedirectResponse(buildLoginPath("Erro ao fazer login"));
  }
}