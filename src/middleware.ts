import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/absences", "/resident", "/api/residents", "/api/shifts", "/api/resident", "/api/absences", "/api/makeups", "/api/resident-summary"];
const publicPaths = ["/", "/api/login", "/api/login-web"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const rawPathname = new URL(request.url).pathname;
  const token = request.cookies.get("auth_token")?.value;
  const isEscalaApiRoute = pathname.startsWith("/api/");
  const isResidentPage = pathname.startsWith("/resident");
  const isNextAsset = pathname.startsWith("/_next/");

  if (
    rawPathname === "/" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  if (isNextAsset) {
    return NextResponse.next();
  }

  // Resident page auth is enforced by API session checks; avoid false redirect loops here.
  if (isResidentPage) {
    return NextResponse.next();
  }

  // API routes should not be redirected to login by middleware.
  // Each API handler is responsible for returning 401/403 when needed.
  if (isEscalaApiRoute) {
    return NextResponse.next();
  }

  // Se é rota pública, deixar passar
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Se é rota protegida e não tem token, redirecionar para raiz (login)
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Verificar se o token é válido
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const isResidentPath = pathname.startsWith("/resident");

    // RESIDENT users trying to access non-resident pages should be redirected.
    if (payload.role === "RESIDENT" && pathname.startsWith("/") && !isResidentPath) {
      return NextResponse.redirect(new URL("/resident/shifts", request.url));
    }

    // Non-RESIDENT users trying to access /resident should be redirected to /escala
    if (payload.role !== "RESIDENT" && pathname.startsWith("/resident")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
