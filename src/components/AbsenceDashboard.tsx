"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, LogOut, Pencil, Plus, Trash2, X } from "lucide-react";
import PreceptorCalendar from "@/components/PreceptorCalendar";
import type { CalendarEvent } from "@/types/calendar";

interface Resident {
  id: string;
  name: string;
  pgyLevel: number;
  totalAbsenceHours: number;
  totalMakeupHours: number;
  balanceHours: number;
  absenceCount: number;
  makeupCount: number;
  login?: string | null;
  password?: string | null;
}

export interface Absence {
  id: string;
  date: string;
  hours: number;
  location: "REANIMACAO" | "CRITICOS" | "MURICI" | "AULA" | "ESTAGIO_EXTERNO" | "OUTRO";
  period: "SD" | "SN";
  type: "ATESTADO" | "SEM_JUSTIFICATIVA" | "OUTRA";
  reason?: string | null;
  observation?: string | null;
}

export interface Makeup {
  id: string;
  date: string;
  hours: number;
  period?: "SD" | "SN" | null;
  observation?: string | null;
}

export interface PlannedMakeup {
  id: string;
  date: string;
  hours: number;
  period: "SD" | "SN";
  observation?: string | null;
}

interface ResidentSummary {
  resident: Resident;
  absences: Absence[];
  makeups: Makeup[];
  plannedMakeups: PlannedMakeup[];
  totalAbsenceHours: number;
  totalMakeupHours: number;
  totalPlannedMakeupHours: number;
  balanceHours: number;
}

type RecordType = "absence" | "makeup" | "planned";
type MobileTab = "dashboard" | "new-record" | "overview" | "residents-manage" | "residents-edit";
type DesktopTab = "dashboard" | "residents" | "residents-manage" | "residents-edit";
type EditTarget =
  | { kind: "absence"; id: string }
  | { kind: "makeup"; id: string }
  | { kind: "planned"; id: string }
  | null;
type HistoryFilterKind = "all" | "absence" | "makeup" | "planned";
type DeleteTarget =
  | {
      kind: "absence" | "makeup" | "planned";
      id: string;
      title: string;
      description: string;
    }
  | null;

const residentGroups = [
  { pgyLevel: 3, label: "R3" },
  { pgyLevel: 2, label: "R2" },
  { pgyLevel: 1, label: "R1" },
] as const;

function formatAbsenceType(type: Absence["type"]) {
  if (type === "ATESTADO") return "Atestado";
  if (type === "SEM_JUSTIFICATIVA") return "Sem justificativa";
  return "Outra justificativa";
}

function formatAbsenceLocation(location: Absence["location"]) {
  if (location === "REANIMACAO") return "Reanimação";
  if (location === "CRITICOS") return "Críticos";
  if (location === "MURICI") return "Murici";
  if (location === "AULA") return "Aula";
  if (location === "ESTAGIO_EXTERNO") return "Estágio externo";
  return "Outro";
}

function formatAbsencePeriod(period: Absence["period"]) {
  return period;
}

function toDateInputValue(dateString: string): string {
  return dateString.split("T")[0];
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString + "T00:00:00Z");
  return date.toLocaleDateString("pt-BR");
}

export default function AbsenceDashboard() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [canEditResidents, setCanEditResidents] = useState(false);
  const [canViewResidentCredentials, setCanViewResidentCredentials] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [selectedResident, setSelectedResident] = useState<ResidentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [recordType, setRecordType] = useState<RecordType>("absence");
  const [mobileTab, setMobileTab] = useState<MobileTab>("dashboard");
  const [desktopTab, setDesktopTab] = useState<DesktopTab>("dashboard");
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [historyMonth, setHistoryMonth] = useState("all");
  const [historyKind, setHistoryKind] = useState<HistoryFilterKind>("all");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceHours, setAbsenceHours] = useState("");
  const [absenceLocation, setAbsenceLocation] = useState<Absence["location"]>("REANIMACAO");
  const [absencePeriod, setAbsencePeriod] = useState<Absence["period"]>("SD");
  const [absenceType, setAbsenceType] = useState<Absence["type"]>("SEM_JUSTIFICATIVA");
  const [absenceReason, setAbsenceReason] = useState("");
  const [absenceObservation, setAbsenceObservation] = useState("");
  const [makeupDate, setMakeupDate] = useState("");
  const [makeupHours, setMakeupHours] = useState("");
  const [makeupPeriod, setMakeupPeriod] = useState<"SD" | "SN">("SD");
  const [makeupObservation, setMakeupObservation] = useState("");
  const [plannedMakeupDate, setPlannedMakeupDate] = useState("");
  const [plannedMakeupHours, setPlannedMakeupHours] = useState("");
  const [plannedMakeupPeriod, setPlannedMakeupPeriod] = useState<"SD" | "SN">("SD");
  const [plannedMakeupObservation, setPlannedMakeupObservation] = useState("");
  const [newResidentName, setNewResidentName] = useState("");
  const [newResidentPgy, setNewResidentPgy] = useState("1");
  const [editingResidentId, setEditingResidentId] = useState("");
  const [editingResidentName, setEditingResidentName] = useState("");
  const [editingResidentPgy, setEditingResidentPgy] = useState("1");
  const [editingResidentLogin, setEditingResidentLogin] = useState("");
  const [editingResidentPassword, setEditingResidentPassword] = useState("");
  const [showMobileOutstandingSheet, setShowMobileOutstandingSheet] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    void fetchSession();
    void fetchResidents();
    void fetchCalendarEvents();
  }, []);

  async function fetchSession() {
    try {
      const res = await fetch("/escala/api/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      const role = data?.session?.role;
      const email = String(data?.session?.email || "").toLowerCase();
      const localPart = email.split("@")[0] || "";
      setCanEditResidents(role === "ADMIN" || localPart === "ana.beatriz");
      setCanViewResidentCredentials(localPart === "ana.beatriz");
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  }

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setActionMessage(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [actionMessage]);

  async function fetchResidents(preferredResidentId?: string) {
    try {
      const res = await fetch("/escala/api/residents", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as Resident[];
      setResidents(data);

      if (data.length > 0) {
        const editTargetId =
          preferredResidentId && data.some((resident) => resident.id === preferredResidentId)
            ? preferredResidentId
            : editingResidentId && data.some((resident) => resident.id === editingResidentId)
              ? editingResidentId
              : data[0].id;

        syncEditingResidentForm(editTargetId, data);
      } else {
        setEditingResidentId("");
        setEditingResidentName("");
        setEditingResidentPgy("1");
        setEditingResidentLogin("");
        setEditingResidentPassword("");
      }

      const nextResidentId = preferredResidentId || selectedResidentId || data[0]?.id || "";
      if (nextResidentId) {
        setSelectedResidentId(nextResidentId);
        await fetchResidentSummary(nextResidentId);
      } else {
        setSelectedResident(null);
      }
    } catch (error) {
      console.error("Error fetching residents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCalendarEvents() {
    try {
      const res = await fetch("/escala/api/calendar-events", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as CalendarEvent[];
      setCalendarEvents(data);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    }
  }

  function syncEditingResidentForm(residentId: string, list = residents) {
    const resident = list.find((item) => item.id === residentId);
    if (!resident) {
      return;
    }

    setEditingResidentId(resident.id);
    setEditingResidentName(resident.name);
    setEditingResidentPgy(String(resident.pgyLevel));
    setEditingResidentLogin(resident.login || "");
    setEditingResidentPassword("");
  }

  async function fetchResidentSummary(residentId: string) {
    try {
      const res = await fetch(`/escala/api/resident-summary?residentId=${residentId}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as ResidentSummary;
      setSelectedResident(data);
      setSelectedResidentId(residentId);
      setHistoryMonth("all");
      setHistoryKind("all");
    } catch (error) {
      console.error("Error fetching resident summary:", error);
    }
  }

  async function handleResidentSelection(residentId: string, nextTab?: MobileTab) {
    await fetchResidentSummary(residentId);
    if (nextTab) {
      setMobileTab(nextTab);
    }
  }

  async function handleSubmitAbsence(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedResident || !absenceDate || !absenceHours) return;

    setSubmitting(true);
    try {
      const isEditing = editTarget?.kind === "absence";
      const res = await fetch(isEditing ? `/escala/api/absences/${editTarget.id}` : "/escala/api/absences", {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: selectedResident.resident.id,
          date: absenceDate,
          hours: Number(absenceHours),
          location: absenceLocation,
          period: absencePeriod,
          type: absenceType,
          reason: absenceType === "OUTRA" ? absenceReason : null,
          observation: absenceObservation || null,
        }),
      });

      if (!res.ok) {
        return;
      }

      await fetchResidents(selectedResident.resident.id);
      resetAbsenceForm();
      setRecordType("absence");
      closeModal();
      setActionMessage(isEditing ? "Falta atualizada." : "Falta registrada.");
    } catch (error) {
      console.error("Error creating absence:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitMakeup(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedResident || !makeupDate || !makeupHours) return;

    setSubmitting(true);
    try {
      const isEditing = editTarget?.kind === "makeup";
      const res = await fetch(isEditing ? `/escala/api/makeups/${editTarget.id}` : "/escala/api/makeups", {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: selectedResident.resident.id,
          date: makeupDate,
          hours: Number(makeupHours),
          period: makeupPeriod,
          observation: makeupObservation || null,
        }),
      });

      if (!res.ok) {
        return;
      }

      await fetchResidents(selectedResident.resident.id);
      resetMakeupForm();
      setRecordType("makeup");
      closeModal();
      setActionMessage(isEditing ? "Reposição atualizada." : "Reposição registrada.");
    } catch (error) {
      console.error("Error creating makeup:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitPlannedMakeup(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedResident || !plannedMakeupDate || !plannedMakeupHours) return;

    setSubmitting(true);
    try {
      const isEditing = editTarget?.kind === "planned";
      const res = await fetch(isEditing ? `/escala/api/planned-makeups/${editTarget.id}` : "/escala/api/planned-makeups", {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: selectedResident.resident.id,
          date: plannedMakeupDate,
          hours: Number(plannedMakeupHours),
          period: plannedMakeupPeriod,
          observation: plannedMakeupObservation || null,
        }),
      });

      if (!res.ok) {
        return;
      }

      await fetchResidents(selectedResident.resident.id);
      resetPlannedMakeupForm();
      setRecordType("planned");
      closeModal();
      setActionMessage(isEditing ? "Reposição prevista atualizada." : "Reposição prevista registrada.");
    } catch (error) {
      console.error("Error creating planned makeup:", error);
    } finally {
      setSubmitting(false);
    }
  }

  function resetAbsenceForm() {
    setAbsenceDate("");
    setAbsenceHours("");
    setAbsenceLocation("REANIMACAO");
    setAbsencePeriod("SD");
    setAbsenceType("SEM_JUSTIFICATIVA");
    setAbsenceReason("");
    setAbsenceObservation("");
  }

  function resetMakeupForm() {
    setMakeupDate("");
    setMakeupHours("");
    setMakeupPeriod("SD");
    setMakeupObservation("");
  }

  function resetPlannedMakeupForm() {
    setPlannedMakeupDate("");
    setPlannedMakeupHours("");
    setPlannedMakeupPeriod("SD");
    setPlannedMakeupObservation("");
  }

  function closeModal() {
    setShowModal(false);
    setEditTarget(null);
    resetAbsenceForm();
    resetMakeupForm();
    resetPlannedMakeupForm();
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
  }

  function openCreateModal(nextType: RecordType) {
    setRecordType(nextType);
    setEditTarget(null);
    resetAbsenceForm();
    resetMakeupForm();
    setShowModal(true);
  }

  function openEditAbsence(absence: Absence) {
    setRecordType("absence");
    setEditTarget({ kind: "absence", id: absence.id });
    setAbsenceDate(toDateInputValue(absence.date));
    setAbsenceHours(String(absence.hours));
    setAbsenceLocation(absence.location);
    setAbsencePeriod(absence.period);
    setAbsenceType(absence.type);
    setAbsenceReason(absence.reason || "");
    setAbsenceObservation(absence.observation || "");
    setShowModal(true);
    setMobileTab("new-record");
  }

  function openEditMakeup(makeup: Makeup) {
    setRecordType("makeup");
    setEditTarget({ kind: "makeup", id: makeup.id });
    setMakeupDate(toDateInputValue(makeup.date));
    setMakeupHours(String(makeup.hours));
    setMakeupPeriod(makeup.period || "SD");
    setMakeupObservation(makeup.observation || "");
    setShowModal(true);
    setMobileTab("new-record");
  }

  function openEditPlannedMakeup(makeup: PlannedMakeup) {
    setRecordType("planned");
    setEditTarget({ kind: "planned", id: makeup.id });
    setPlannedMakeupDate(toDateInputValue(makeup.date));
    setPlannedMakeupHours(String(makeup.hours));
    setPlannedMakeupPeriod(makeup.period || "SD");
    setPlannedMakeupObservation(makeup.observation || "");
    setShowModal(true);
    setMobileTab("new-record");
  }

  function requestDeleteAbsence(absence: Absence) {
    setDeleteTarget({
      kind: "absence",
      id: absence.id,
      title: "Remover falta",
      description: `A falta de ${absence.hours}h em ${formatDateLabel(absence.date)} será excluída.`,
    });
  }

  function requestDeleteMakeup(makeup: Makeup) {
    setDeleteTarget({
      kind: "makeup",
      id: makeup.id,
      title: "Remover reposição",
      description: `A reposição de ${makeup.hours}h em ${formatDateLabel(makeup.date)} será excluída.`,
    });
  }

  function requestDeletePlannedMakeup(makeup: PlannedMakeup) {
    setDeleteTarget({
      kind: "planned",
      id: makeup.id,
      title: "Remover reposição prevista",
      description: `A reposição prevista de ${makeup.hours}h em ${formatDateLabel(makeup.date)} será excluída.`,
    });
  }

  async function handleDeleteAbsence(absenceId: string) {
    if (!selectedResident) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/escala/api/absences/${absenceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        return;
      }

      await fetchResidents(selectedResident.resident.id);
      closeModal();
      closeDeleteDialog();
      setActionMessage("Falta removida.");
    } catch (error) {
      console.error("Error deleting absence:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteMakeup(makeupId: string) {
    if (!selectedResident) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/escala/api/makeups/${makeupId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        return;
      }

      await fetchResidents(selectedResident.resident.id);
      closeModal();
      closeDeleteDialog();
      setActionMessage("Reposição removida.");
    } catch (error) {
      console.error("Error deleting makeup:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePlannedMakeup(makeupId: string) {
    if (!selectedResident) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/escala/api/planned-makeups/${makeupId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        return;
      }

      await fetchResidents(selectedResident.resident.id);
      closeModal();
      closeDeleteDialog();
      setActionMessage("Reposição prevista removida.");
    } catch (error) {
      console.error("Error deleting planned makeup:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmPlannedMakeup(makeupId: string) {
    if (!selectedResident) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/escala/api/planned-makeups/${makeupId}`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!res.ok) {
        return;
      }

      await fetchResidents(selectedResident.resident.id);
      setActionMessage("Reposição prevista confirmada e movida para reposição.");
    } catch (error) {
      console.error("Error confirming planned makeup:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateResident(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = newResidentName.trim();
    if (!trimmedName) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/escala/api/residents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          pgyLevel: Number(newResidentPgy),
        }),
      });

      if (!res.ok) {
        setActionMessage("Não foi possível cadastrar o residente.");
        return;
      }

      setNewResidentName("");
      setNewResidentPgy("1");
      await fetchResidents();
      setActionMessage("Residente cadastrado.");
    } catch (error) {
      console.error("Error creating resident:", error);
      setActionMessage("Não foi possível cadastrar o residente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteResident(residentId: string, residentName: string) {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover ${residentName}? Esta ação também exclui todo o histórico de faltas e reposições do residente.`
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/escala/api/residents/${residentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        setActionMessage("Não foi possível remover o residente.");
        return;
      }

      const nextResidentId = selectedResidentId === residentId ? undefined : selectedResidentId;
      await fetchResidents(nextResidentId);
      setActionMessage("Residente removido.");
    } catch (error) {
      console.error("Error deleting resident:", error);
      setActionMessage("Não foi possível remover o residente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateResident(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = editingResidentName.trim();
    const trimmedLogin = editingResidentLogin.trim().toLowerCase();

    if (!editingResidentId || !trimmedName || !trimmedLogin) {
      setActionMessage("Preencha nome e login do residente.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/escala/api/residents/${editingResidentId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          pgyLevel: Number(editingResidentPgy),
          login: trimmedLogin,
          password: editingResidentPassword.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActionMessage(data?.error || "Não foi possível atualizar o residente.");
        return;
      }

      await fetchResidents(editingResidentId);
      setEditingResidentPassword("");
      setActionMessage("Dados do residente atualizados.");
    } catch (error) {
      console.error("Error updating resident:", error);
      setActionMessage("Não foi possível atualizar o residente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/escala/api/logout", { method: "POST", credentials: "include" });
    window.location.replace("/escala/login");
  }

  const groupedResidents = residentGroups.map((group) => ({
    ...group,
    residents: residents
      .filter((resident) => resident.pgyLevel === group.pgyLevel)
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" })),
  }));

  const residentsWithOutstandingBalance = residents.filter((resident) => resident.balanceHours > 0);
  const residentsWithOutstandingBalanceSorted = [...residentsWithOutstandingBalance].sort(
    (left, right) => right.balanceHours - left.balanceHours || left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" })
  );
  const totalOutstandingHours = residentsWithOutstandingBalance.reduce((sum, resident) => sum + resident.balanceHours, 0);
  const historyEntries = selectedResident
    ? [
        ...selectedResident.absences.map((absence) => ({
          id: absence.id,
          kind: "absence" as const,
          date: absence.date,
          label: formatAbsenceType(absence.type),
          details: `${formatAbsenceLocation(absence.location)} · ${formatAbsencePeriod(absence.period)}${absence.reason ? ` · ${absence.reason}` : ""}`,
          hours: absence.hours,
          observation: absence.observation,
          onEdit: () => openEditAbsence(absence),
          onDelete: () => requestDeleteAbsence(absence),
          onConfirm: undefined,
          confirmLabel: undefined,
        })),
        ...selectedResident.makeups.map((makeup) => ({
          id: makeup.id,
          kind: "makeup" as const,
          date: makeup.date,
          label: "Reposição lançada",
          details: "Carga horária reposta",
          hours: makeup.hours,
          observation: null,
          onEdit: () => openEditMakeup(makeup),
          onDelete: () => requestDeleteMakeup(makeup),
          onConfirm: undefined,
          confirmLabel: undefined,
        })),
        ...selectedResident.plannedMakeups.map((makeup) => ({
          id: makeup.id,
          kind: "planned" as const,
          date: makeup.date,
          label: "Reposição prevista",
          details: `Turno ${makeup.period}${makeup.observation ? ` · ${makeup.observation}` : ""}`,
          hours: makeup.hours,
          observation: makeup.observation,
          onEdit: () => openEditPlannedMakeup(makeup),
          onDelete: () => requestDeletePlannedMakeup(makeup),
          onConfirm: () => void handleConfirmPlannedMakeup(makeup.id),
          confirmLabel: "Confirmar",
        })),
      ]
    : [];
  const availableMonths = Array.from(
    new Set(historyEntries.map((entry) => entry.date.slice(0, 7)))
  ).sort((left, right) => right.localeCompare(left));
  const filteredAbsences =
    selectedResident?.absences.filter(
      (absence) =>
        (historyKind === "all" || historyKind === "absence") &&
        (historyMonth === "all" || absence.date.startsWith(historyMonth))
    ) || [];
  const filteredMakeups =
    selectedResident?.makeups.filter(
      (makeup) =>
        (historyKind === "all" || historyKind === "makeup") &&
        (historyMonth === "all" || makeup.date.startsWith(historyMonth))
    ) || [];
  const filteredPlannedMakeups =
    selectedResident?.plannedMakeups.filter(
      (makeup) =>
        (historyKind === "all" || historyKind === "planned") &&
        (historyMonth === "all" || makeup.date.startsWith(historyMonth))
    ) || [];

  const timeline = historyEntries
    .filter(
      (entry) =>
        (historyKind === "all" || historyKind === entry.kind) &&
        (historyMonth === "all" || entry.date.startsWith(historyMonth))
    )
    .sort((left, right) => right.date.localeCompare(left.date));

  if (loading) {
    return (
      <div className="ambient-shell flex min-h-screen items-center justify-center px-4">
        <div className="glass-surface-strong rounded-[28px] px-6 py-5 text-sm font-medium text-slate-600">Carregando residentes...</div>
      </div>
    );
  }

  return (
    <div className="ambient-shell min-h-screen text-slate-900">
      <header className="hero-band sticky top-0 z-30 border-b border-white/10 text-white backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-5 lg:px-8">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100 backdrop-blur">Painel central</div>
            <h1 className="mt-2 text-base font-black uppercase tracking-[0.16em] sm:mt-3 sm:text-[1.35rem] sm:tracking-[0.24em]">Controle de Faltas e Reposições</h1>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-300 sm:text-xs sm:tracking-[0.16em]">Painel do preceptor</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 sm:px-4 sm:py-2.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {actionMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
            {actionMessage}
          </div>
        ) : null}

        <section className="mb-6 space-y-4 lg:hidden">
          <div className="pill-tabs sticky top-3 z-20 -mx-1 overflow-x-auto rounded-2xl p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max snap-x gap-2">
            <button
              onClick={() => setMobileTab("dashboard")}
                className={`snap-start rounded-xl px-3 py-2 text-xs font-semibold transition ${
                mobileTab === "dashboard" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setMobileTab("new-record")}
                className={`snap-start rounded-xl px-3 py-2 text-xs font-semibold transition ${
                mobileTab === "new-record" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Nova falta
            </button>
            <button
              onClick={() => setMobileTab("overview")}
                className={`snap-start rounded-xl px-3 py-2 text-xs font-semibold transition ${
                mobileTab === "overview" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Residentes
            </button>
            {canEditResidents ? (
              <button
                onClick={() => setMobileTab("residents-manage")}
                  className={`snap-start rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  mobileTab === "residents-manage" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                Cadastro
              </button>
            ) : null}
            {canEditResidents ? (
              <button
                onClick={() => setMobileTab("residents-edit")}
                  className={`snap-start rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  mobileTab === "residents-edit" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                Editar
              </button>
            ) : null}
            </div>
          </div>

          {mobileTab === "dashboard" ? (
            <div className="space-y-4">
              <MobileDashboardExecutive
                residents={residentsWithOutstandingBalanceSorted}
                totalHours={totalOutstandingHours}
                onSelect={(residentId) => void handleResidentSelection(residentId, "new-record")}
                onViewAll={() => setShowMobileOutstandingSheet(true)}
              />
              <MobileCalendarPanel
                events={calendarEvents}
              />
            </div>
          ) : null}

          {mobileTab === "new-record" ? (
            <div className="space-y-4">
              <div className="glass-surface rounded-[28px] p-4">
                <label className="block text-sm font-medium text-slate-700">Residente selecionado</label>
                <select
                  value={selectedResidentId}
                  onChange={(event) => void handleResidentSelection(event.target.value)}
                  className="modern-input mt-2 sm:text-sm"
                >
                  {residents.map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {resident.name} · R{resident.pgyLevel}
                    </option>
                  ))}
                </select>
              </div>

              {selectedResident ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <MetricCard label="Faltas" value={`${selectedResident.totalAbsenceHours}h`} tone="red" compact />
                    <MetricCard label="Repos." value={`${selectedResident.totalMakeupHours}h`} tone="green" compact />
                    <MetricCard label="Saldo" value={`${selectedResident.balanceHours}h`} tone="amber" compact />
                  </div>

                  <div className="glass-surface rounded-[28px] shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <h2 className="font-semibold text-slate-900">{editTarget ? "Editar lançamento" : "Novo lançamento"}</h2>
                    <p className="mt-1 text-sm text-slate-500">{selectedResident.resident.name}</p>
                  </div>
                  <div className="p-4">
                    <RecordTypeSelector recordType={recordType} setRecordType={setRecordType} />
                    {recordType === "absence" ? (
                      <AbsenceForm
                        absenceDate={absenceDate}
                        setAbsenceDate={setAbsenceDate}
                        absenceHours={absenceHours}
                        setAbsenceHours={setAbsenceHours}
                        absenceLocation={absenceLocation}
                        setAbsenceLocation={setAbsenceLocation}
                        absencePeriod={absencePeriod}
                        setAbsencePeriod={setAbsencePeriod}
                        absenceType={absenceType}
                        setAbsenceType={setAbsenceType}
                        absenceReason={absenceReason}
                        setAbsenceReason={setAbsenceReason}
                        absenceObservation={absenceObservation}
                        setAbsenceObservation={setAbsenceObservation}
                        submitting={submitting}
                        onSubmit={handleSubmitAbsence}
                      />
                    ) : recordType === "makeup" ? (
                      <MakeupForm
                        makeupDate={makeupDate}
                        setMakeupDate={setMakeupDate}
                        makeupHours={makeupHours}
                        setMakeupHours={setMakeupHours}
                        makeupPeriod={makeupPeriod}
                        setMakeupPeriod={setMakeupPeriod}
                        makeupObservation={makeupObservation}
                        setMakeupObservation={setMakeupObservation}
                        submitting={submitting}
                        onSubmit={handleSubmitMakeup}
                      />
                    ) : (
                      <MakeupForm
                        makeupDate={plannedMakeupDate}
                        setMakeupDate={setPlannedMakeupDate}
                        makeupHours={plannedMakeupHours}
                        setMakeupHours={setPlannedMakeupHours}
                        makeupPeriod={plannedMakeupPeriod}
                        setMakeupPeriod={setPlannedMakeupPeriod}
                        makeupObservation={plannedMakeupObservation}
                        setMakeupObservation={setPlannedMakeupObservation}
                        submitting={submitting}
                        onSubmit={handleSubmitPlannedMakeup}
                      />
                    )}
                  </div>
                  </div>

                  <div className="glass-surface rounded-[28px] shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-4">
                      <h2 className="font-semibold text-slate-900">Histórico recente</h2>
                      <p className="mt-1 text-sm text-slate-500">Edite ou remova lançamentos sem sair do celular.</p>
                    </div>
                    <div className="space-y-4 p-4">
                      <HistoryFilters
                        historyMonth={historyMonth}
                        setHistoryMonth={setHistoryMonth}
                        historyKind={historyKind}
                        setHistoryKind={setHistoryKind}
                        availableMonths={availableMonths}
                        compact
                      />
                      <HistoryCard title="Faltas" tone="red" compact>
                        <MobileRecordSection
                          emptyText="Nenhuma falta registrada."
                          tone="red"
                          items={filteredAbsences.map((absence) => ({
                          id: absence.id,
                          date: absence.date,
                          primary: `${formatAbsenceLocation(absence.location)} · ${formatAbsencePeriod(absence.period)}`,
                          secondary: `${formatAbsenceType(absence.type)}${absence.reason ? ` · ${absence.reason}` : absence.observation ? ` · ${absence.observation}` : ""}`,
                          badge: `-${absence.hours}h`,
                          onEdit: () => openEditAbsence(absence),
                          onDelete: () => requestDeleteAbsence(absence),
                          }))}
                        />
                      </HistoryCard>
                      <HistoryCard title="Reposições" tone="green" compact>
                        <MobileRecordSection
                          emptyText="Nenhuma reposição registrada."
                          tone="green"
                          items={filteredMakeups.map((makeup) => ({
                          id: makeup.id,
                          date: makeup.date,
                          primary: "Carga horária reposta",
                          secondary: "Reposição lançada",
                          badge: `+${makeup.hours}h`,
                          onEdit: () => openEditMakeup(makeup),
                          onDelete: () => requestDeleteMakeup(makeup),
                          }))}
                        />
                      </HistoryCard>
                      <HistoryCard title="Reposições previstas" tone="amber" compact>
                        <MobileRecordSection
                          emptyText="Nenhuma reposição prevista."
                          tone="amber"
                          items={filteredPlannedMakeups.map((makeup) => ({
                          id: makeup.id,
                          date: makeup.date,
                          primary: `Turno ${makeup.period}`,
                          secondary: `Reposição prevista${makeup.observation ? ` · ${makeup.observation}` : ""}`,
                          badge: `+${makeup.hours}h`,
                          onEdit: () => openEditPlannedMakeup(makeup),
                          onDelete: () => requestDeletePlannedMakeup(makeup),
                          onConfirm: () => void handleConfirmPlannedMakeup(makeup.id),
                          confirmLabel: "Confirmar",
                          }))}
                        />
                      </HistoryCard>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {mobileTab === "overview" ? (
            <div className="space-y-4">
              {groupedResidents.map((group) => (
                <section key={group.pgyLevel} className="glass-surface rounded-[28px] p-4">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
                    <h2 className="text-lg font-black uppercase tracking-[0.24em]">{group.label}</h2>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                      {group.residents.length} residentes
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {group.residents.map((resident) => (
                      <button
                        key={resident.id}
                        onClick={() => void handleResidentSelection(resident.id, "new-record")}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-slate-900">{resident.name}</div>
                            <div className="mt-1 text-xs text-slate-500">R{resident.pgyLevel}</div>
                          </div>
                          <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resident.balanceHours > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {resident.balanceHours}h
                          </div>
                        </div>
                        <ResidentMetricGrid resident={resident} compact />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {mobileTab === "residents-manage" && canEditResidents ? (
            <ResidentManagementPanel
              residents={residents}
              newResidentName={newResidentName}
              setNewResidentName={setNewResidentName}
              newResidentPgy={newResidentPgy}
              setNewResidentPgy={setNewResidentPgy}
              submitting={submitting}
              onCreate={handleCreateResident}
              onDelete={handleDeleteResident}
              canViewResidentCredentials={canViewResidentCredentials}
            />
          ) : null}

          {mobileTab === "residents-edit" && canEditResidents ? (
            <ResidentEditPanel
              residents={residents}
              editingResidentId={editingResidentId}
              setEditingResidentId={(residentId) => syncEditingResidentForm(residentId)}
              editingResidentName={editingResidentName}
              setEditingResidentName={setEditingResidentName}
              editingResidentPgy={editingResidentPgy}
              setEditingResidentPgy={setEditingResidentPgy}
              editingResidentLogin={editingResidentLogin}
              setEditingResidentLogin={setEditingResidentLogin}
              editingResidentPassword={editingResidentPassword}
              setEditingResidentPassword={setEditingResidentPassword}
              submitting={submitting}
              onSubmit={handleUpdateResident}
            />
          ) : null}
        </section>

        {canEditResidents ? (
          <div className="hidden lg:grid lg:grid-cols-[240px_1fr] lg:gap-0 lg:min-h-[calc(100vh-8rem)]">
            <aside className="glass-surface sticky top-24 h-[calc(100vh-7rem)] rounded-r-2xl rounded-l-none shadow-lg overflow-y-auto">
              <div className="flex flex-col border-r border-slate-200">
                <div className="border-b border-slate-200 px-5 py-5">
                  <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">Painel</div>
                  <div className="mt-1.5 text-base font-bold text-slate-900">Controle</div>
                </div>
                <nav className="space-y-1 p-3">
                  <button
                    onClick={() => setDesktopTab("dashboard")}
                    className={`w-full rounded-xl px-4 py-3 text-left text-sm transition font-medium ${
                      desktopTab === "dashboard" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setDesktopTab("residents")}
                    className={`w-full rounded-xl px-4 py-3 text-left text-sm transition font-medium ${
                      desktopTab === "residents" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Residentes
                  </button>
                  <button
                    onClick={() => setDesktopTab("residents-manage")}
                    className={`w-full rounded-xl px-4 py-3 text-left text-sm transition font-medium ${
                      desktopTab === "residents-manage" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Cadastro
                  </button>
                  <button
                    onClick={() => setDesktopTab("residents-edit")}
                    className={`w-full rounded-xl px-4 py-3 text-left text-sm transition font-medium ${
                      desktopTab === "residents-edit" ? "bg-slate-900 text-white font-semibold" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Editar usuários
                  </button>
                </nav>
              </div>
            </aside>

            <div className="min-w-0 space-y-6 px-2 py-6 lg:px-4">
              {desktopTab === "dashboard" ? (
                <section className="grid gap-4 lg:grid-cols-[minmax(350px,1fr)_minmax(380px,1.3fr)] lg:items-start">
                  <div className="min-w-0">
                    <OutstandingBalancePanel
                      residents={residentsWithOutstandingBalanceSorted}
                      totalHours={totalOutstandingHours}
                      selectedResidentId={selectedResidentId}
                      onSelect={(residentId) => void handleResidentSelection(residentId)}
                      dense
                    />
                  </div>
                  <div className="min-w-0">
                    <PreceptorCalendar events={calendarEvents} />
                  </div>
                </section>
              ) : null}

              {desktopTab === "residents" ? (
                <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                  <aside className="glass-surface h-fit rounded-[30px] lg:sticky lg:top-24">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h2 className="text-base font-semibold text-slate-900">Residentes</h2>
                      <p className="mt-1 text-xs text-slate-500">Selecione para ver histórico.</p>
                    </div>
                    <div className="space-y-4 p-4">
                      {groupedResidents.map((group) => (
                        <section key={group.pgyLevel}>
                          <div className="mb-2 flex items-center justify-between rounded-2xl bg-slate-900 px-3 py-3 text-white">
                            <h3 className="text-sm font-black uppercase tracking-[0.24em]">{group.label}</h3>
                            <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                              {group.residents.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {group.residents.map((resident) => (
                              <button
                                key={resident.id}
                                onClick={() => void handleResidentSelection(resident.id)}
                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                                  selectedResidentId === resident.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-semibold text-slate-900">{resident.name}</div>
                                    <div className="mt-0.5 text-xs text-slate-500">R{resident.pgyLevel}</div>
                                  </div>
                                  <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resident.balanceHours > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                    {resident.balanceHours}h
                                  </div>
                                </div>
                                <ResidentMetricGrid resident={resident} compact />
                              </button>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </aside>

                  <section className="space-y-4">
                    <div className="glass-surface rounded-3xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">{selectedResident?.resident.name || "Selecione um residente"}</h2>
                          <p className="mt-1 text-xs text-slate-500">
                            {selectedResident ? `R${selectedResident.resident.pgyLevel}` : "Selecione um residente"}
                          </p>
                        </div>
                        {selectedResident ? (
                          <button
                            onClick={() => openCreateModal("absence")}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4" />
                            Novo lançamento
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {selectedResident ? (
                      <>
                        <div className="grid gap-4 md:grid-cols-3">
                          <MetricCard label="Horas de falta" value={`${selectedResident.totalAbsenceHours}h`} tone="red" />
                          <MetricCard label="Horas repostas" value={`${selectedResident.totalMakeupHours}h`} tone="green" />
                          <MetricCard label="Saldo pendente" value={`${selectedResident.balanceHours}h`} tone="amber" />
                        </div>

                        <div className="grid gap-6 xl:grid-cols-2">
                          <HistoryCard title="Faltas lançadas" tone="red">
                            {filteredAbsences.length === 0 ? (
                              <EmptyState text="Nenhuma falta registrada." />
                            ) : (
                              <div className="space-y-3 p-4">
                                {filteredAbsences.map((absence) => (
                                  <RecordEntryCard
                                    key={absence.id}
                                    tone="red"
                                    date={absence.date}
                                    title={formatAbsenceLocation(absence.location)}
                                    description={`${formatAbsenceType(absence.type)}${absence.reason ? ` · ${absence.reason}` : absence.observation ? ` · ${absence.observation}` : ""}`}
                                    badge={`-${absence.hours}h`}
                                    onEdit={() => openEditAbsence(absence)}
                                    onDelete={() => requestDeleteAbsence(absence)}
                                  />
                                ))}
                              </div>
                            )}
                          </HistoryCard>

                          <HistoryCard title="Reposições lançadas" tone="green">
                            {filteredMakeups.length === 0 ? (
                              <EmptyState text="Nenhuma reposição registrada." />
                            ) : (
                              <div className="space-y-3 p-4">
                                {filteredMakeups.map((makeup) => (
                                  <RecordEntryCard
                                    key={makeup.id}
                                    tone="green"
                                    date={makeup.date}
                                    title="Carga horária reposta"
                                    description="Reposição lançada"
                                    badge={`+${makeup.hours}h`}
                                    onEdit={() => openEditMakeup(makeup)}
                                    onDelete={() => requestDeleteMakeup(makeup)}
                                  />
                                ))}
                              </div>
                            )}
                          </HistoryCard>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-2">
                          <HistoryCard title="Reposições previstas" tone="amber">
                            {filteredPlannedMakeups.length === 0 ? (
                              <EmptyState text="Nenhuma reposição prevista." />
                            ) : (
                              <div className="space-y-3 p-4">
                                {filteredPlannedMakeups.map((makeup) => (
                                  <RecordEntryCard
                                    key={makeup.id}
                                    tone="amber"
                                    date={makeup.date}
                                    title={`Turno ${makeup.period}`}
                                    description={`Reposição prevista${makeup.observation ? ` · ${makeup.observation}` : ""}`}
                                    badge={`+${makeup.hours}h`}
                                    onEdit={() => openEditPlannedMakeup(makeup)}
                                    onDelete={() => requestDeletePlannedMakeup(makeup)}
                                    onConfirm={() => void handleConfirmPlannedMakeup(makeup.id)}
                                    confirmLabel="Confirmar"
                                  />
                                ))}
                              </div>
                            )}
                          </HistoryCard>

                          <HistoryCard title="Linha do tempo" tone="slate">
                            <div className="space-y-4 p-4">
                              <HistoryFilters
                                historyMonth={historyMonth}
                                setHistoryMonth={setHistoryMonth}
                                historyKind={historyKind}
                                setHistoryKind={setHistoryKind}
                                availableMonths={availableMonths}
                              />
                              {timeline.length === 0 ? (
                                <EmptyState text="Nenhum evento encontrado para os filtros selecionados." />
                              ) : (
                                <div className="space-y-3">
                                  {timeline.map((entry) => (
                                    <RecordEntryCard
                                      key={entry.id}
                                      tone={entry.kind === "absence" ? "red" : entry.kind === "makeup" ? "green" : "amber"}
                                      date={entry.date}
                                      title={entry.label}
                                      description={entry.details}
                                      badge={entry.kind === "absence" ? `-${entry.hours}h` : `+${entry.hours}h`}
                                      onEdit={entry.onEdit}
                                      onDelete={entry.onDelete}
                                      onConfirm={entry.onConfirm}
                                      confirmLabel={entry.confirmLabel}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </HistoryCard>
                        </div>
                      </>
                    ) : (
                      <div className="glass-surface rounded-[30px] p-8 text-center text-sm text-slate-500">Selecione um residente para iniciar o lançamento.</div>
                    )}
                  </section>
                </div>
              ) : null}

              {desktopTab === "residents-manage" && canEditResidents ? (
                <ResidentManagementPanel
                  residents={residents}
                  newResidentName={newResidentName}
                  setNewResidentName={setNewResidentName}
                  newResidentPgy={newResidentPgy}
                  setNewResidentPgy={setNewResidentPgy}
                  submitting={submitting}
                  onCreate={handleCreateResident}
                  onDelete={handleDeleteResident}
                  canViewResidentCredentials={canViewResidentCredentials}
                  desktop
                />
              ) : null}

              {desktopTab === "residents-edit" && canEditResidents ? (
                <ResidentEditPanel
                  residents={residents}
                  editingResidentId={editingResidentId}
                  setEditingResidentId={(residentId) => syncEditingResidentForm(residentId)}
                  editingResidentName={editingResidentName}
                  setEditingResidentName={setEditingResidentName}
                  editingResidentPgy={editingResidentPgy}
                  setEditingResidentPgy={setEditingResidentPgy}
                  editingResidentLogin={editingResidentLogin}
                  setEditingResidentLogin={setEditingResidentLogin}
                  editingResidentPassword={editingResidentPassword}
                  setEditingResidentPassword={setEditingResidentPassword}
                  submitting={submitting}
                  onSubmit={handleUpdateResident}
                  desktop
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {showMobileOutstandingSheet ? (
          <div className="lg:hidden">
            <ModalShell mobileBottomSheet>
              <ModalHeader
                eyebrow="Dashboard"
                title="Residentes pendentes"
                description="Lista completa de saldos para priorizar os lançamentos."
                onClose={() => setShowMobileOutstandingSheet(false)}
              />
              <ModalBody>
                <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                  {residentsWithOutstandingBalanceSorted.length === 0 ? (
                    <div className="soft-inset rounded-2xl px-4 py-4 text-sm text-slate-600">Nenhum residente com horas pendentes.</div>
                  ) : (
                    residentsWithOutstandingBalanceSorted.map((resident) => (
                      <button
                        key={resident.id}
                        type="button"
                        onClick={() => {
                          setShowMobileOutstandingSheet(false);
                          void handleResidentSelection(resident.id, "new-record");
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900">{resident.name}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">R{resident.pgyLevel}</div>
                          </div>
                          <div className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{resident.balanceHours}h</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ModalBody>
            </ModalShell>
          </div>
        ) : null}
      </main>

      {showModal && selectedResident ? (
        <ModalShell>
          <ModalHeader
            eyebrow={editTarget ? "Atualização de lançamento" : "Novo lançamento"}
            title={
              editTarget
                ? recordType === "absence"
                  ? "Editar falta"
                  : recordType === "makeup"
                    ? "Editar reposição"
                    : "Editar reposição prevista"
                : recordType === "absence"
                  ? "Registrar falta"
                  : recordType === "makeup"
                    ? "Registrar reposição"
                    : "Registrar reposição prevista"
            }
            description={selectedResident.resident.name}
            onClose={closeModal}
          />
          <ModalBody>
            <ModalInfoCard
              title={recordType === "absence" ? "Lançamento de falta" : recordType === "makeup" ? "Lançamento de reposição" : "Lançamento de reposição prevista"}
              description={
                editTarget
                  ? "Atualize os dados abaixo para corrigir o histórico e recalcular o saldo imediatamente."
                  : "Preencha os dados abaixo para registrar o lançamento e atualizar o saldo do residente."
              }
            />
            <div className="mt-5">
              <RecordTypeSelector recordType={recordType} setRecordType={setRecordType} />
              {recordType === "absence" ? (
                <AbsenceForm
                  absenceDate={absenceDate}
                  setAbsenceDate={setAbsenceDate}
                  absenceHours={absenceHours}
                  setAbsenceHours={setAbsenceHours}
                  absenceLocation={absenceLocation}
                  setAbsenceLocation={setAbsenceLocation}
                  absencePeriod={absencePeriod}
                  setAbsencePeriod={setAbsencePeriod}
                  absenceType={absenceType}
                  setAbsenceType={setAbsenceType}
                  absenceReason={absenceReason}
                  setAbsenceReason={setAbsenceReason}
                  absenceObservation={absenceObservation}
                  setAbsenceObservation={setAbsenceObservation}
                  submitting={submitting}
                  onSubmit={handleSubmitAbsence}
                  showCancel
                  onCancel={closeModal}
                  submitLabel={editTarget?.kind === "absence" ? "Salvar alterações" : "Salvar falta"}
                />
              ) : recordType === "makeup" ? (
                <MakeupForm
                  makeupDate={makeupDate}
                  setMakeupDate={setMakeupDate}
                  makeupHours={makeupHours}
                  setMakeupHours={setMakeupHours}
                  makeupPeriod={makeupPeriod}
                  setMakeupPeriod={setMakeupPeriod}
                  makeupObservation={makeupObservation}
                  setMakeupObservation={setMakeupObservation}
                  submitting={submitting}
                  onSubmit={handleSubmitMakeup}
                  showCancel
                  onCancel={closeModal}
                  submitLabel={editTarget?.kind === "makeup" ? "Salvar alterações" : "Salvar reposição"}
                />
              ) : (
                <MakeupForm
                  makeupDate={plannedMakeupDate}
                  setMakeupDate={setPlannedMakeupDate}
                  makeupHours={plannedMakeupHours}
                  setMakeupHours={setPlannedMakeupHours}
                  makeupPeriod={plannedMakeupPeriod}
                  setMakeupPeriod={setPlannedMakeupPeriod}
                  makeupObservation={plannedMakeupObservation}
                  setMakeupObservation={setPlannedMakeupObservation}
                  submitting={submitting}
                  onSubmit={handleSubmitPlannedMakeup}
                  showCancel
                  onCancel={closeModal}
                  submitLabel={editTarget?.kind === "planned" ? "Salvar alterações" : "Salvar reposição prevista"}
                />
              )}
            </div>
          </ModalBody>
        </ModalShell>
      ) : null}

      {deleteTarget ? (
        <ModalShell mobileBottomSheet>
          <ModalHeader
            eyebrow="Confirmação necessária"
            title={deleteTarget.title}
            description={deleteTarget.description}
            tone="danger"
            icon={<AlertTriangle className="h-6 w-6" />}
            onClose={closeDeleteDialog}
          />
          <ModalBody>
            <ModalInfoCard
              title="O que acontece ao confirmar"
              description="O lançamento será removido do histórico e o saldo do residente será recalculado imediatamente."
            />
            <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Manter lançamento
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    deleteTarget.kind === "absence"
                      ? void handleDeleteAbsence(deleteTarget.id)
                      : deleteTarget.kind === "makeup"
                        ? void handleDeleteMakeup(deleteTarget.id)
                        : void handleDeletePlannedMakeup(deleteTarget.id)
                  }
                  className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {submitting ? "Removendo..." : "Remover lançamento"}
                </button>
              </div>
          </ModalBody>
        </ModalShell>
      ) : null}
    </div>
  );
}

function MobileCalendarPanel({ events }: { events: CalendarEvent[] }) {
  const now = new Date();
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<
    | {
        dateLabel: string;
        items: CalendarEvent[];
      }
    | null
  >(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  function moveMonth(direction: -1 | 1) {
    if (direction === -1) {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((prev) => prev - 1);
      } else {
        setCurrentMonth((prev) => prev - 1);
      }
      return;
    }

    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  }

  function isSameDate(dateStr: string, year: number, month: number, day: number): boolean {
    const [eventYear, eventMonth, eventDay] = dateStr.split("T")[0].split("-").map(Number);
    return eventYear === year && eventMonth - 1 === month && eventDay === day;
  }

  function getDayEvents(day: number) {
    return events.filter((event) => isSameDate(event.date, currentYear, currentMonth, day));
  }

  const daysArray: Array<number | null> = [
    ...Array.from({ length: firstDay }, () => null as null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const monthAgenda = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateLabel = new Date(currentYear, currentMonth, day).toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "long",
    });
    const items = getDayEvents(day);
    return { day, dateLabel, items };
  }).filter((entry) => entry.items.length > 0);

  return (
    <div className="glass-surface overflow-hidden rounded-[28px] shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-800">Calendário</h2>
          <div className="pill-tabs grid grid-cols-2 gap-1 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${viewMode === "month" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${viewMode === "agenda" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              Agenda
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Eventos de todos os residentes neste calendário.
        </p>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold capitalize text-slate-700">{monthLabel}</div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-lg border border-slate-200 bg-slate-50 p-1.5"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="rounded-lg border border-slate-200 bg-slate-50 p-1.5"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Falta</div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Prevista</div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" />Confirmada</div>
        </div>

        {viewMode === "month" ? (
          <div>
            <div className="mb-1 grid grid-cols-7 gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
                <div key={day} className="text-center">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {daysArray.map((day, index) => {
                const dayEvents = day ? getDayEvents(day) : [];
                const hasAbsence = dayEvents.some((event) => event.kind === "absence");
                const hasPlanned = dayEvents.some((event) => event.kind === "planned");
                const hasConfirmed = dayEvents.some((event) => event.kind === "confirmed");

                return (
                  <button
                    key={`${day || "empty"}-${index}`}
                    type="button"
                    onClick={() => {
                      if (!day) return;
                      const dateLabel = new Date(currentYear, currentMonth, day).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      });
                      setSelectedDay({ dateLabel, items: dayEvents });
                    }}
                    className={`h-12 rounded-lg border text-xs ${
                      !day
                        ? "border-transparent bg-transparent"
                        : dayEvents.length > 0
                          ? "border-slate-200 bg-white"
                          : "border-slate-100 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {day ? (
                      <div className="flex h-full flex-col items-center justify-center">
                        <span className="font-medium text-slate-700">{day}</span>
                        <span className="mt-1 flex gap-1">
                          {hasAbsence ? <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> : null}
                          {hasPlanned ? <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> : null}
                          {hasConfirmed ? <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> : null}
                        </span>
                        {dayEvents.length > 2 ? <div className="text-[10px] font-semibold text-slate-500">+{dayEvents.length - 2}</div> : null}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {monthAgenda.length === 0 ? (
              <div className="soft-inset rounded-2xl px-4 py-4 text-sm text-slate-500">Sem eventos neste mês.</div>
            ) : (
              monthAgenda.map((entry) => (
                <button
                  key={entry.day}
                  type="button"
                  onClick={() => setSelectedDay({ dateLabel: entry.dateLabel, items: entry.items })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-800">{entry.dateLabel}</div>
                    <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {entry.items.length} evento{entry.items.length > 1 ? "s" : ""}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {selectedDay ? (
        <ModalShell mobileBottomSheet>
          <ModalHeader
            eyebrow="Eventos do dia"
            title={selectedDay.dateLabel}
            description="Resumo de faltas e reposições registradas para esta data."
            onClose={() => setSelectedDay(null)}
          />
          <ModalBody>
            <div className="space-y-2">
              {selectedDay.items.map((event, index) => (
                <div key={`${event.kind}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{event.label}: {event.residentName}</div>
                      <div className="mt-1 text-xs text-slate-600">{event.details}</div>
                    </div>
                    <div
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        event.kind === "absence"
                          ? "bg-red-100 text-red-700"
                          : event.kind === "planned"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {event.kind === "absence" ? `-${event.hours}h` : `+${event.hours}h`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
        </ModalShell>
      ) : null}
    </div>
  );
}

function MobileDashboardExecutive({
  residents,
  totalHours,
  onSelect,
  onViewAll,
}: {
  residents: Resident[];
  totalHours: number;
  onSelect: (residentId: string) => void;
  onViewAll: () => void;
}) {
  const topResidents = residents.slice(0, 3);

  function getPriorityTone(hours: number) {
    if (hours >= 48) {
      return "bg-red-50 text-red-700 border border-red-200";
    }
    if (hours >= 24) {
      return "bg-amber-50 text-amber-700 border border-amber-200";
    }
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  function getPriorityLabel(hours: number) {
    if (hours >= 48) {
      return "Alta";
    }
    if (hours >= 24) {
      return "Media";
    }
    return "Baixa";
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[30px] border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.92)_0%,rgba(254,243,199,0.88)_100%)] p-4 shadow-[0_18px_44px_rgba(245,158,11,0.13)]">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/75 px-3 py-3 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Pendentes</div>
            <div className="mt-1 text-3xl font-black text-amber-900">{residents.length}</div>
          </div>
          <div className="rounded-2xl bg-white/75 px-3 py-3 text-right shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Horas</div>
            <div className="mt-1 text-3xl font-black text-amber-900">{totalHours}h</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {topResidents.length === 0 ? (
            <div className="rounded-2xl bg-white/70 px-4 py-4 text-sm text-amber-700">Nenhum residente com saldo pendente.</div>
          ) : (
            topResidents.map((resident) => (
              <button
                key={resident.id}
                type="button"
                onClick={() => onSelect(resident.id)}
                className="w-full rounded-2xl border border-white/70 bg-white px-4 py-3 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{resident.name}</div>
                    <div className="mt-1 text-xs text-slate-500">R{resident.pgyLevel}</div>
                  </div>
                  <div className="text-right">
                    <div className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{resident.balanceHours}h</div>
                    <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${getPriorityTone(resident.balanceHours)}`}>
                      {getPriorityLabel(resident.balanceHours)}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {residents.length > 3 ? (
          <button
            type="button"
            onClick={onViewAll}
            className="mt-3 w-full rounded-2xl border border-amber-200 bg-white/85 px-4 py-2.5 text-sm font-semibold text-amber-800"
          >
            Ver todos os pendentes
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ModalShell({
  children,
  mobileBottomSheet,
}: {
  children: React.ReactNode;
  mobileBottomSheet?: boolean;
}) {
  return (
    <div className={`fixed inset-0 z-50 flex justify-center bg-slate-950/45 p-4 ${mobileBottomSheet ? "items-end sm:items-center" : "items-center"}`}>
      <div className="glass-surface-strong w-full max-w-md overflow-hidden rounded-[30px]">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  eyebrow,
  title,
  description,
  onClose,
  tone = "default",
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  onClose: () => void;
  tone?: "default" | "danger";
  icon?: React.ReactNode;
}) {
  const toneStyles =
    tone === "danger"
      ? {
          wrapper: "bg-[linear-gradient(135deg,rgba(254,242,242,0.96)_0%,rgba(255,255,255,0.92)_62%)]",
          eyebrow: "text-red-600",
          icon: "border-red-200 bg-white/80 text-red-700",
        }
      : {
          wrapper: "bg-[linear-gradient(135deg,rgba(239,246,255,0.96)_0%,rgba(255,255,255,0.92)_62%)]",
          eyebrow: "text-blue-600",
          icon: "border-blue-200 bg-white/80 text-blue-700",
        };

  return (
    <div className={`${toneStyles.wrapper} px-6 py-6`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-2xl border p-3 shadow-sm ${toneStyles.icon}`}>
          {icon || <Plus className="h-6 w-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${toneStyles.eyebrow}`}>{eyebrow}</div>
          <h2 className="mt-2 text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-white/80 hover:text-slate-700">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-5">{children}</div>;
}

function ModalInfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="soft-inset rounded-2xl px-4 py-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function MetricCard({ label, value, tone, compact }: { label: string; value: string; tone: "red" | "green" | "amber" | "slate"; compact?: boolean }) {
  const valueClass = tone === "red" ? "text-red-600" : tone === "green" ? "text-green-600" : tone === "amber" ? "text-amber-600" : "text-slate-900";

  return (
    <div className={`soft-card rounded-[26px] ${compact ? "p-4" : "p-5"}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-2 font-bold ${compact ? "text-2xl" : "text-3xl"} ${valueClass}`}>{value}</div>
    </div>
  );
}

function OutstandingBalancePanel({
  residents,
  totalHours,
  onSelect,
  selectedResidentId,
  dense,
}: {
  residents: Resident[];
  totalHours: number;
  onSelect: (residentId: string) => void;
  selectedResidentId?: string;
  dense?: boolean;
}) {
  return (
    <div className="rounded-[30px] border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.92)_0%,rgba(254,243,199,0.88)_100%)] p-5 shadow-[0_24px_60px_rgba(245,158,11,0.14)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Carga Horária a Repor</div>
          <div className="mt-2 text-4xl font-black text-amber-900">{residents.length}</div>
          <div className="mt-1 text-sm text-amber-800">{residents.length === 1 ? "residente pendente" : "residentes pendentes"}</div>
        </div>
        <div className="rounded-2xl bg-white/70 px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Total</div>
          <div className="mt-1 text-2xl font-black text-amber-900">{totalHours}h</div>
        </div>
      </div>

      {residents.length > 0 ? (
        <div className={`mt-4 grid gap-2 ${dense ? "xl:grid-cols-2" : ""}`}>
          {residents.map((resident) => (
            <button
              key={resident.id}
              onClick={() => onSelect(resident.id)}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left shadow-sm transition ${
                selectedResidentId === resident.id
                    ? "border border-amber-400 bg-white"
                    : "border border-white/30 bg-white/70 hover:bg-white"
              }`}
            >
              <div>
                <div className="font-bold text-slate-900">{resident.name}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">R{resident.pgyLevel}</div>
              </div>
              <div className="rounded-full bg-amber-200 px-3 py-1 text-sm font-bold text-amber-900">{resident.balanceHours}h</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white/60 px-4 py-6 text-center text-sm text-amber-700">
          Nenhum residente com horas pendentes.
        </div>
      )}
    </div>
  );
}

function ResidentMetricGrid({ resident, compact }: { resident: Resident; compact?: boolean }) {
  return (
    <div className={`mt-3 grid ${compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-4"} gap-2 text-xs text-slate-600`}>
      <MetricChip label="Faltas" value={`${resident.totalAbsenceHours}h`} />
      <MetricChip label="Repos." value={`${resident.totalMakeupHours}h`} />
      <MetricChip label="Lanç." value={String(resident.absenceCount)} />
      <MetricChip label="Saldo" value={`${resident.balanceHours}h`} />
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/80 px-2.5 py-2 shadow-sm backdrop-blur">
      <div className="font-semibold text-slate-900">{value}</div>
      <div className="text-slate-500">{label}</div>
    </div>
  );
}

function HistoryCard({ title, tone, children, compact }: { title: string; tone: "red" | "green" | "amber" | "slate"; children: React.ReactNode; compact?: boolean }) {
  const titleClass =
    tone === "red"
      ? "text-red-900"
      : tone === "green"
        ? "text-green-900"
        : "text-amber-900"
  const headerClass =
    tone === "red"
      ? "bg-[linear-gradient(135deg,rgba(254,242,242,0.95),rgba(255,255,255,0.9))]"
      : tone === "green"
        ? "bg-[linear-gradient(135deg,rgba(240,253,244,0.95),rgba(255,255,255,0.9))]"
        : tone === "amber"
          ? "bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,255,255,0.9))]"
          : "bg-[linear-gradient(135deg,rgba(241,245,249,0.95),rgba(255,255,255,0.9))]";

  return (
    <div className="glass-surface overflow-hidden rounded-[28px]">
      <div className={`border-b border-white/60 ${compact ? "px-4 py-4" : "px-6 py-4"} ${headerClass}`}>
        <h3 className={`text-sm font-black uppercase tracking-[0.18em] ${titleClass}`}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function RecordActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function HistoryFilters({
  historyMonth,
  setHistoryMonth,
  historyKind,
  setHistoryKind,
  availableMonths,
  compact,
}: {
  historyMonth: string;
  setHistoryMonth: (value: string) => void;
  historyKind: HistoryFilterKind;
  setHistoryKind: (value: HistoryFilterKind) => void;
  availableMonths: string[];
  compact?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "md:grid-cols-[1fr_220px]"}`}>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Mês</span>
        <select
          value={historyMonth}
          onChange={(event) => setHistoryMonth(event.target.value)}
          className="modern-input text-sm"
        >
          <option value="all">Todos os meses</option>
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tipo</span>
        <select
          value={historyKind}
          onChange={(event) => setHistoryKind(event.target.value as HistoryFilterKind)}
          className="modern-input text-sm"
        >
          <option value="all">Tudo</option>
          <option value="absence">Faltas</option>
          <option value="makeup">Reposições</option>
          <option value="planned">Reposições previstas</option>
        </select>
      </label>
    </div>
  );
}

function MobileRecordSection({
  emptyText,
  tone,
  items,
}: {
  emptyText: string;
  tone: "red" | "green" | "amber";
  items: Array<{
    id: string;
    date: string;
    primary: string;
    secondary: string;
    badge: string;
    onEdit: () => void;
    onDelete: () => void;
    onConfirm?: () => void;
    confirmLabel?: string;
  }>;
}) {
  return (
    <div>
      {items.length === 0 ? (
        <div className="soft-inset rounded-2xl px-4 py-5 text-sm text-slate-500">{emptyText}</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <RecordEntryCard
              key={item.id}
              tone={tone}
              date={item.date}
              title={item.primary}
              description={item.secondary}
              badge={item.badge}
              onEdit={item.onEdit}
              onDelete={item.onDelete}
              onConfirm={item.onConfirm}
              confirmLabel={item.confirmLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ResidentManagementPanel({
  residents,
  newResidentName,
  setNewResidentName,
  newResidentPgy,
  setNewResidentPgy,
  submitting,
  onCreate,
  onDelete,
  canViewResidentCredentials,
  desktop,
}: {
  residents: Resident[];
  newResidentName: string;
  setNewResidentName: (value: string) => void;
  newResidentPgy: string;
  setNewResidentPgy: (value: string) => void;
  submitting: boolean;
  onCreate: (event: React.FormEvent) => void;
  onDelete: (residentId: string, residentName: string) => void;
  canViewResidentCredentials: boolean;
  desktop?: boolean;
}) {
  return (
    <div className={`space-y-4 ${desktop ? "max-w-3xl" : ""}`}>
      <div className="glass-surface rounded-[28px] p-5">
        <h2 className="text-lg font-bold text-slate-900">Cadastro de novo residente</h2>
        <p className="mt-1 text-sm text-slate-600">Disponível para Ana Beatriz e administradores.</p>

        <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px_auto]">
          <input
            value={newResidentName}
            onChange={(event) => setNewResidentName(event.target.value)}
            placeholder="Nome completo"
            required
            className="modern-input"
          />
          <select
            value={newResidentPgy}
            onChange={(event) => setNewResidentPgy(event.target.value)}
            className="modern-input"
          >
            <option value="1">R1</option>
            <option value="2">R2</option>
            <option value="3">R3</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Salvando..." : "Cadastrar"}
          </button>
        </form>
      </div>

      <div className="glass-surface rounded-[28px] p-5">
        <h3 className="text-base font-semibold text-slate-900">Residentes cadastrados</h3>
        <div className="mt-3 space-y-2">
          {residents.map((resident) => (
            <div
              key={resident.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-semibold text-slate-900">{resident.name}</p>
                <p className="text-xs text-slate-500">R{resident.pgyLevel}</p>
                {canViewResidentCredentials ? (
                  <>
                    <p className="mt-1 text-xs text-slate-600">
                      Login: <span className="font-semibold text-slate-800">{resident.login || "--"}</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      Senha: <span className="font-semibold text-slate-800">{resident.password || "--"}</span>
                    </p>
                  </>
                ) : null}
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => onDelete(resident.id, resident.name)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResidentEditPanel({
  residents,
  editingResidentId,
  setEditingResidentId,
  editingResidentName,
  setEditingResidentName,
  editingResidentPgy,
  setEditingResidentPgy,
  editingResidentLogin,
  setEditingResidentLogin,
  editingResidentPassword,
  setEditingResidentPassword,
  submitting,
  onSubmit,
  desktop,
}: {
  residents: Resident[];
  editingResidentId: string;
  setEditingResidentId: (value: string) => void;
  editingResidentName: string;
  setEditingResidentName: (value: string) => void;
  editingResidentPgy: string;
  setEditingResidentPgy: (value: string) => void;
  editingResidentLogin: string;
  setEditingResidentLogin: (value: string) => void;
  editingResidentPassword: string;
  setEditingResidentPassword: (value: string) => void;
  submitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
  desktop?: boolean;
}) {
  return (
    <div className={`space-y-4 ${desktop ? "max-w-3xl" : ""}`}>
      <div className="glass-surface rounded-[28px] p-5">
        <h2 className="text-lg font-bold text-slate-900">Editar dados de residente</h2>
        <p className="mt-1 text-sm text-slate-600">Atualize nome, ano, login e senha de acesso.</p>

        {residents.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Nenhum residente cadastrado.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Residente</span>
              <select
                value={editingResidentId}
                onChange={(event) => setEditingResidentId(event.target.value)}
                className="modern-input"
              >
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.name} · R{resident.pgyLevel}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Nome</span>
              <input
                value={editingResidentName}
                onChange={(event) => setEditingResidentName(event.target.value)}
                required
                className="modern-input"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ano</span>
                <select
                  value={editingResidentPgy}
                  onChange={(event) => setEditingResidentPgy(event.target.value)}
                  className="modern-input"
                >
                  <option value="1">R1</option>
                  <option value="2">R2</option>
                  <option value="3">R3</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Login</span>
                <input
                  value={editingResidentLogin}
                  onChange={(event) => setEditingResidentLogin(event.target.value.toLowerCase())}
                  placeholder="nome.sobrenome"
                  required
                  className="modern-input"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Nova senha</span>
              <input
                type="text"
                value={editingResidentPassword}
                onChange={(event) => setEditingResidentPassword(event.target.value)}
                placeholder="Deixe em branco para manter a senha atual"
                className="modern-input"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function RecordEntryCard({
  tone,
  date,
  title,
  description,
  badge,
  onEdit,
  onDelete,
  onConfirm,
  confirmLabel,
}: {
  tone: "red" | "green" | "amber";
  date: string;
  title: string;
  description: string;
  badge: string;
  onEdit: () => void;
  onDelete: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
}) {
  const badgeClass =
    tone === "red"
      ? "bg-red-100 text-red-700"
      : tone === "green"
        ? "bg-green-100 text-green-700"
        : "bg-amber-100 text-amber-700";

  return (
    <div className="soft-card rounded-[24px] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-slate-900">{formatDateLabel(date)}</div>
          <div className="mt-1 text-sm text-slate-700">{title}</div>
          <div className="mt-1 text-sm text-slate-500">{description}</div>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
          {badge}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {onConfirm ? (
          <button type="button" onClick={onConfirm} className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50">
            {confirmLabel || "Confirmar"}
          </button>
        ) : null}
        <button type="button" onClick={onEdit} className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white">
          Editar
        </button>
        <button type="button" onClick={onDelete} className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50">
          Remover
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-10 text-sm text-slate-500">{text}</div>;
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function RecordTypeSelector({ recordType, setRecordType }: { recordType: RecordType; setRecordType: (value: RecordType) => void }) {
  return (
    <div className="pill-tabs mb-6 grid grid-cols-3 gap-2 rounded-2xl p-1.5">
      <button
        type="button"
        onClick={() => setRecordType("absence")}
        className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${recordType === "absence" ? "bg-white text-red-700 shadow-sm" : "text-slate-600"}`}
      >
        Falta
      </button>
      <button
        type="button"
        onClick={() => setRecordType("makeup")}
        className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${recordType === "makeup" ? "bg-white text-green-700 shadow-sm" : "text-slate-600"}`}
      >
        Reposição
      </button>
      <button
        type="button"
        onClick={() => setRecordType("planned")}
        className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${recordType === "planned" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600"}`}
      >
        Reposição prevista
      </button>
    </div>
  );
}

function AbsenceForm({
  absenceDate,
  setAbsenceDate,
  absenceHours,
  setAbsenceHours,
  absenceLocation,
  setAbsenceLocation,
  absencePeriod,
  setAbsencePeriod,
  absenceType,
  setAbsenceType,
  absenceReason,
  setAbsenceReason,
  absenceObservation,
  setAbsenceObservation,
  submitting,
  onSubmit,
  showCancel,
  onCancel,
  submitLabel,
}: {
  absenceDate: string;
  setAbsenceDate: (value: string) => void;
  absenceHours: string;
  setAbsenceHours: (value: string) => void;
  absenceLocation: Absence["location"];
  setAbsenceLocation: (value: Absence["location"]) => void;
  absencePeriod: Absence["period"];
  setAbsencePeriod: (value: Absence["period"]) => void;
  absenceType: Absence["type"];
  setAbsenceType: (value: Absence["type"]) => void;
  absenceReason: string;
  setAbsenceReason: (value: string) => void;
  absenceObservation: string;
  setAbsenceObservation: (value: string) => void;
  submitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
  showCancel?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Data da falta</label>
        <input type="date" value={absenceDate} onChange={(event) => setAbsenceDate(event.target.value)} required className="modern-input mt-1 sm:text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Quantidade de horas</label>
        <input type="number" min="1" max="24" value={absenceHours} onChange={(event) => setAbsenceHours(event.target.value)} required className="modern-input mt-1 sm:text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Local da falta</label>
        <select value={absenceLocation} onChange={(event) => setAbsenceLocation(event.target.value as Absence["location"])} className="modern-input mt-1 sm:text-sm">
          <option value="REANIMACAO">Reanimação</option>
          <option value="CRITICOS">Críticos</option>
          <option value="MURICI">Murici</option>
          <option value="AULA">Aula</option>
          <option value="ESTAGIO_EXTERNO">Estágio externo</option>
          <option value="OUTRO">Outro</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Turno da falta</label>
        <select value={absencePeriod} onChange={(event) => setAbsencePeriod(event.target.value as Absence["period"])} className="modern-input mt-1 sm:text-sm">
          <option value="SD">SD (dia)</option>
          <option value="SN">SN (noite)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Tipo de falta</label>
        <select value={absenceType} onChange={(event) => setAbsenceType(event.target.value as Absence["type"])} className="modern-input mt-1 sm:text-sm">
          <option value="ATESTADO">Atestado</option>
          <option value="SEM_JUSTIFICATIVA">Sem justificativa</option>
          <option value="OUTRA">Outra justificativa</option>
        </select>
      </div>
      {absenceType === "OUTRA" ? (
        <div>
          <label className="block text-sm font-medium text-slate-700">Justificativa</label>
          <input type="text" value={absenceReason} onChange={(event) => setAbsenceReason(event.target.value)} placeholder="Descreva o motivo" className="modern-input mt-1 sm:text-sm" />
        </div>
      ) : null}
      <div>
        <label className="block text-sm font-medium text-slate-700">Observação</label>
        <textarea value={absenceObservation} onChange={(event) => setAbsenceObservation(event.target.value)} placeholder="Nota opcional sobre o ocorrido" rows={3} className="modern-input mt-1 sm:text-sm" />
      </div>
      <div className={`flex ${showCancel ? "gap-3" : ""}`}>
        {showCancel ? (
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Cancelar
          </button>
        ) : null}
        <button type="submit" disabled={submitting} className={`${showCancel ? "flex-1" : "w-full"} rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60`}>
          {submitting ? "Salvando..." : submitLabel || "Salvar falta"}
        </button>
      </div>
    </form>
  );
}

function MakeupForm({
  makeupDate,
  setMakeupDate,
  makeupHours,
  setMakeupHours,
  makeupPeriod,
  setMakeupPeriod,
  makeupObservation,
  setMakeupObservation,
  submitting,
  onSubmit,
  showCancel,
  onCancel,
  submitLabel,
}: {
  makeupDate: string;
  setMakeupDate: (value: string) => void;
  makeupHours: string;
  setMakeupHours: (value: string) => void;
  makeupPeriod: "SD" | "SN";
  setMakeupPeriod: (value: "SD" | "SN") => void;
  makeupObservation: string;
  setMakeupObservation: (value: string) => void;
  submitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
  showCancel?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Data da reposição</label>
        <input type="date" value={makeupDate} onChange={(event) => setMakeupDate(event.target.value)} required className="modern-input mt-1 sm:text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Quantidade de horas</label>
        <input type="number" min="1" max="24" value={makeupHours} onChange={(event) => setMakeupHours(event.target.value)} required className="modern-input mt-1 sm:text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Turno</label>
        <select value={makeupPeriod} onChange={(event) => setMakeupPeriod(event.target.value as "SD" | "SN")} className="modern-input mt-1 sm:text-sm">
          <option value="SD">SD (Diurno)</option>
          <option value="SN">SN (Noturno)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Observação</label>
        <textarea value={makeupObservation} onChange={(event) => setMakeupObservation(event.target.value)} placeholder="Adicione observações opcionais..." className="modern-input mt-1 sm:text-sm resize-none" rows={3} />
      </div>
      <div className={`flex ${showCancel ? "gap-3" : ""}`}>
        {showCancel ? (
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Cancelar
          </button>
        ) : null}
        <button type="submit" disabled={submitting} className={`${showCancel ? "flex-1" : "w-full"} rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60`}>
          {submitting ? "Salvando..." : submitLabel || "Salvar reposição"}
        </button>
      </div>
    </form>
  );
}