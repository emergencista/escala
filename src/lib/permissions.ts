import type { JWTPayload } from "@/lib/auth";

const RESIDENT_MANAGERS = new Set(["ana.beatriz"]);

export function canViewResidentCredentials(session: JWTPayload | null): boolean {
  if (!session) {
    return false;
  }

  const localPart = session.email.split("@")[0]?.toLowerCase() ?? "";
  return localPart === "ana.beatriz";
}

export function canManageResidents(session: JWTPayload | null): boolean {
  if (!session) {
    return false;
  }

  if (session.role === "ADMIN") {
    return true;
  }

  const localPart = session.email.split("@")[0]?.toLowerCase() ?? "";
  return RESIDENT_MANAGERS.has(localPart);
}
