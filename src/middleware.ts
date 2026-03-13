import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/escala", "/resident", "/api/residents", "/api/shifts", "/api/resident", "/api/absences", "/api/makeups", "/api/resident-summary"];
const publicPaths = ["/login", "/api/login"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("auth_token")?.value;

  // Se é rota pública, deixar passar
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Se é rota protegida e não tem token, redirecionar para login
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!token) {
      return NextResponse.redirect(new URL("/escala/login", request.url));
    }

    // Verificar se o token é válido
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/escala/login", request.url));
    }

    // RESIDENT users trying to access /escala should be redirected to /resident/shifts
    if (payload.role === "RESIDENT" && pathname.startsWith("/escala")) {
      return NextResponse.redirect(new URL("/escala/resident/shifts", request.url));
    }

    // Non-RESIDENT users trying to access /resident should be redirected to /escala
    if (payload.role !== "RESIDENT" && pathname.startsWith("/escala/resident")) {
      return NextResponse.redirect(new URL("/escala", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
