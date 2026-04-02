export type AbsenceLocation =
  | "REANIMACAO"
  | "CRITICOS"
  | "MURICI"
  | "AULA"
  | "ESTAGIO_EXTERNO"
  | "OUTRO";

export type AbsencePeriod = "SD" | "SN";

export type AbsenceType = "ATESTADO" | "SEM_JUSTIFICATIVA" | "OUTRA";

export interface ResidentAbsence {
  id: string;
  date: string;
  hours: number;
  location: AbsenceLocation;
  period: AbsencePeriod;
  type: AbsenceType;
  reason?: string | null;
  observation?: string | null;
}

export interface ResidentMakeup {
  id: string;
  date: string;
  hours: number;
  period?: AbsencePeriod | null;
  observation?: string | null;
  status: "CONFIRMED";
}

export interface ResidentPlannedMakeup {
  id: string;
  date: string;
  hours: number;
  period?: AbsencePeriod | null;
  observation?: string | null;
  status: "PLANNED";
}

export interface ResidentDashboardData {
  name: string;
  pgyLevel: number;
  absences: ResidentAbsence[];
  makeups: ResidentMakeup[];
  plannedMakeups: ResidentPlannedMakeup[];
  totalAbsenceHours: number;
  totalMakeupHours: number;
  totalPlannedMakeupHours: number;
  balanceHours: number;
}