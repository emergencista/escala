import "server-only";

import prisma from "@/lib/prisma";
import type { ResidentDashboardData } from "@/types/resident";

export async function getResidentDashboardDataForUser(
  userId: string,
): Promise<ResidentDashboardData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (!user) {
    return null;
  }

  const resident = await prisma.resident.findFirst({
    where: {
      name: {
        equals: user.name,
        mode: "insensitive",
      },
    },
    include: {
      absences: {
        orderBy: { date: "desc" },
      },
      makeups: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!resident) {
    return null;
  }

  const totalAbsenceHours = resident.absences.reduce((sum, absence) => sum + absence.hours, 0);
  const confirmedMakeups = resident.makeups.filter((makeup) => makeup.status === "CONFIRMED");
  const plannedMakeups = resident.makeups.filter((makeup) => makeup.status === "PLANNED");
  const totalMakeupHours = confirmedMakeups.reduce((sum, makeup) => sum + makeup.hours, 0);
  const totalPlannedMakeupHours = plannedMakeups.reduce((sum, plannedMakeup) => sum + plannedMakeup.hours, 0);

  return {
    name: resident.name,
    pgyLevel: resident.pgyLevel,
    absences: resident.absences.map((absence) => ({
      id: absence.id,
      date: absence.date.toISOString(),
      hours: absence.hours,
      location: absence.location,
      period: absence.period,
      type: absence.type,
      reason: absence.reason,
      observation: absence.observation,
    })),
    makeups: confirmedMakeups.map((makeup) => ({
      id: makeup.id,
      date: makeup.date.toISOString(),
      hours: makeup.hours,
      period: makeup.period,
      observation: makeup.observation,
      status: "CONFIRMED" as const,
    })),
    plannedMakeups: plannedMakeups.map((makeup) => ({
      id: makeup.id,
      date: makeup.date.toISOString(),
      hours: makeup.hours,
      period: makeup.period,
      observation: makeup.observation,
      status: "PLANNED" as const,
    })),
    totalAbsenceHours,
    totalMakeupHours,
    totalPlannedMakeupHours,
    balanceHours: totalAbsenceHours - totalMakeupHours,
  };
}