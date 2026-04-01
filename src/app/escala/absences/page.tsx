"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Resident {
  id: string;
  name: string;
  pgyLevel: number;
}

interface Absence {
  id: string;
  date: string;
  hours: number;
  type: "ATESTADO" | "SEM_JUSTIFICATIVA" | "OUTRA";
  reason?: string;
}

interface Makeup {
  id: string;
  date: string;
  hours: number;
}

interface ResidentSummary {
  resident: Resident;
  absences: Absence[];
  makeups: Makeup[];
  totalAbsenceHours: number;
  totalMakeupHours: number;
  balanceHours: number;
}


export default function AbsencesPage() {
  const router = useRouter();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResident, setSelectedResident] = useState<ResidentSummary | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [recordType, setRecordType] = useState<"absence" | "makeup">("absence");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form states
  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceHours, setAbsenceHours] = useState("");
  const [absenceType, setAbsenceType] = useState<"ATESTADO" | "SEM_JUSTIFICATIVA" | "OUTRA">(
    "SEM_JUSTIFICATIVA"
  );
  const [absenceReason, setAbsenceReason] = useState("");
  const [makeupDate, setMakeupDate] = useState("");
  const [makeupHours, setMakeupHours] = useState("");
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/escala/api/residents");
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a: Resident, b: Resident) => b.pgyLevel - a.pgyLevel);
        setResidents(sorted);
        if (sorted.length > 0) {
          handleResidentClick(sorted[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching residents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResidentClick = async (resident: Resident) => {
    try {
      const res = await fetch(`/escala/api/resident-summary?residentId=${resident.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedResident(data);
      }
    } catch (err) {
      console.error("Error fetching resident summary:", err);
    }
  };

  const calendarDays = useMemo(() => {
    if (!selectedResident) return [];

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map((day) => {
      const dayAbsences = selectedResident.absences.filter((absence) =>
        isSameDay(parseISO(absence.date), day)
      );
      const dayMakeups = selectedResident.makeups.filter((makeup) =>
        isSameDay(parseISO(makeup.date), day)
      );
      return {
        date: day,
        absences: dayAbsences,
        makeups: dayMakeups,
      };
    });
  }, [currentMonth, selectedResident]);

  const handleSubmitAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident || !absenceDate || !absenceHours) return;

    setSubmitting(true);
    try {
      const res = await fetch("/escala/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: selectedResident.resident.id,
          date: new Date(absenceDate).toISOString(),
          hours: parseInt(absenceHours),
          type: absenceType,
          reason: absenceReason || null,
        }),
      });

      if (res.ok) {
        await handleResidentClick(selectedResident.resident);
        setShowModal(false);
        setAbsenceDate("");
        setAbsenceHours("");
        setAbsenceReason("");
      }
    } catch (err) {
      console.error("Error creating absence:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitMakeup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident || !makeupDate || !makeupHours) return;

    setSubmitting(true);
    try {
      const res = await fetch("/escala/api/makeups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId: selectedResident.resident.id,
          date: new Date(makeupDate).toISOString(),
          hours: parseInt(makeupHours),
        }),
      });

      if (res.ok) {
        await handleResidentClick(selectedResident.resident);
        setShowModal(false);
        setMakeupDate("");
        setMakeupHours("");
      }
    } catch (err) {
      console.error("Error creating makeup:", err);
    } finally {
      setSubmitting(false);
    }
  };


  const handleLogout = async () => {
    await fetch("/escala/api/logout", { method: "POST" });
    router.push("/escala/login");
  };

  if (loading && !selectedResident) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Controle de Faltas</h1>
              {selectedResident && <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{selectedResident.resident.name}</p>}
            </div>
            <div className="flex items-center gap-3">
              {residents.length > 0 && (
                <div className="lg:hidden relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Residentes
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                      <div className="py-2 max-h-64 overflow-y-auto">
                        {residents.map((resident) => (
                          <button
                            key={resident.id}
                            onClick={() => {
                              handleResidentClick(resident);
                              setShowMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm transition ${
                              selectedResident?.resident.id === resident.id
                                ? "bg-blue-50 text-blue-900 font-semibold"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="font-medium">{resident.name}</div>
                            <div className="text-xs opacity-75">R{resident.pgyLevel}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-red-700 transition"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-0 py-3 sm:py-4">
        <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="hidden lg:flex bg-white border-r border-gray-200 h-full flex-col sticky top-20">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="font-semibold text-gray-900 text-sm">Residentes</h2>
            </div>
            <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
              {residents.map((resident) => (
                <button
                  key={resident.id}
                  onClick={() => handleResidentClick(resident)}
                  className={`w-full px-4 py-3 text-left text-sm transition ${
                    selectedResident?.resident.id === resident.id
                      ? "bg-blue-50 text-blue-900 border-l-4 border-blue-500 font-semibold"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="font-medium">{resident.name}</div>
                  <div className="text-xs opacity-75">R{resident.pgyLevel}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedResident ? (
            <div className="w-full flex flex-col">
              <div className="p-3 sm:p-4 lg:p-5 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="rounded-lg bg-white p-3 sm:p-5 shadow-sm border border-gray-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Falta</p>
                  <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-red-600">
                    {selectedResident.totalAbsenceHours}h
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 sm:p-5 shadow-sm border border-gray-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Reposição</p>
                  <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-green-600">
                    {selectedResident.totalMakeupHours}h
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 sm:p-5 shadow-sm border border-gray-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Saldo</p>
                  <p
                    className={`mt-1 sm:mt-2 text-xl sm:text-3xl font-bold ${
                      selectedResident.balanceHours > 0 ? "text-orange-600" : "text-gray-600"
                    }`}
                  >
                    {selectedResident.balanceHours}h
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-white shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 text-gray-500 hover:text-gray-800 transition hover:bg-gray-100 rounded"><ChevronLeft className="h-5 w-5" /></button>
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg min-w-[160px] text-center">
                      {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                    </h3>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 text-gray-500 hover:text-gray-800 transition hover:bg-gray-100 rounded"><ChevronRight className="h-5 w-5" /></button>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Adicionar</span>
                    <span className="sm:hidden">+</span>
                  </button>
                </div>

                <div className="grid grid-cols-7 text-center font-semibold text-sm text-gray-700 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                  {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((day, i) => (
                    <div key={i} className="py-3 text-xs sm:text-sm">{day.slice(0, 3).toUpperCase()}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map(({ date, absences, makeups }) => (
                    <DayCell 
                      key={date.toString()}
                      date={date}
                      absences={absences}
                      makeups={makeups}
                      isCurrentMonth={isSameMonth(date, currentMonth)}
                    />
                  ))}
                </div>
              </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full p-4 sm:p-6 lg:p-8 bg-gray-50 lg:bg-white">
              <div className="text-center">
                <p className="text-gray-500 text-sm sm:text-base">Selecione um residente à esquerda</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && <ModalForm {...{ showModal, setShowModal, recordType, setRecordType, handleSubmitAbsence, handleSubmitMakeup, submitting, absenceDate, setAbsenceDate, absenceHours, setAbsenceHours, absenceType, setAbsenceType, absenceReason, setAbsenceReason, makeupDate, setMakeupDate, makeupHours, setMakeupHours }} />}
    </div>
  );
}

function DayCell({ date, absences, makeups, isCurrentMonth }: { date: Date, absences: Absence[], makeups: Makeup[], isCurrentMonth: boolean }) {
  const hasEvents = absences.length > 0 || makeups.length > 0;
  const totalAbsenceHours = absences.reduce((sum, a) => sum + a.hours, 0);
  const totalMakeupHours = makeups.reduce((sum, m) => sum + m.hours, 0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(media.matches);

    apply();
    media.addEventListener("change", apply);

    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (isDesktop) return;
    if (!isOpen) return;

    const onDocPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocPointerDown);
    document.addEventListener("touchstart", onDocPointerDown);

    return () => {
      document.removeEventListener("mousedown", onDocPointerDown);
      document.removeEventListener("touchstart", onDocPointerDown);
    };
  }, [isDesktop, isOpen]);

  const openByHover = () => {
    if (isDesktop && hasEvents) {
      setIsOpen(true);
    }
  };

  const closeByHover = () => {
    if (isDesktop) {
      setIsOpen(false);
    }
  };

  const toggleByClick = () => {
    if (!isDesktop && hasEvents) {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative h-full"
      onMouseEnter={openByHover}
      onMouseLeave={closeByHover}
    >
      <button
        type="button"
        onClick={toggleByClick}
        className={`
          w-full h-20 lg:h-24 border-r border-b border-gray-200 p-1.5 sm:p-2 flex flex-col justify-start text-left transition-colors
          ${isCurrentMonth ? "bg-white hover:bg-blue-50" : "bg-gray-50/50"}
          ${hasEvents ? "cursor-pointer" : "cursor-default"}
          ${isOpen ? "ring-inset ring-2 ring-blue-400" : ""}
        `}
      >
        <span
          className={`text-sm sm:text-base font-bold leading-tight ${
            isCurrentMonth ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {format(date, "d")}
        </span>
        {hasEvents && (
          <div className="mt-1 sm:mt-2 flex gap-1.5 text-xs">
            {totalAbsenceHours > 0 && (
              <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Tem faltas" />
            )}
            {totalMakeupHours > 0 && (
              <span className="h-2 w-2 rounded-full bg-green-500" aria-label="Tem reposições" />
            )}
          </div>
        )}
      </button>

      {hasEvents && isOpen && (
        <div className="absolute z-[9999] top-full mt-1 w-52 sm:w-64 transform -translate-x-1/2 left-1/2">
          <div className="overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/15 bg-white">
            <div className="p-3 sm:p-4 space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 border-b pb-2">
                {format(date, "d 'de' MMM", { locale: ptBR })}
              </h3>
              {absences.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-1">Faltas</p>
                  <div className="space-y-0.5">
                    {absences.map((a) => (
                      <p key={a.id} className="text-xs text-gray-700 leading-tight">
                        <span className="font-semibold">-{a.hours}h</span>{" "}
                        {a.type === "ATESTADO" ? "Atestado" : "S/ justif."}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {makeups.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1">Reposições</p>
                  <div className="space-y-0.5">
                    {makeups.map((m) => (
                      <p key={m.id} className="text-xs text-gray-700 font-semibold">+{m.hours}h</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalForm({ showModal, setShowModal, recordType, setRecordType, handleSubmitAbsence, handleSubmitMakeup, submitting, absenceDate, setAbsenceDate, absenceHours, setAbsenceHours, absenceType, setAbsenceType, absenceReason, setAbsenceReason, makeupDate, setMakeupDate, makeupHours, setMakeupHours }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white shadow-2xl m-4">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg text-gray-900">
            {recordType === "absence" ? "Registrar Falta" : "Registrar Reposição"}
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setRecordType("absence")}
              className={`py-2 px-3 rounded-md text-sm font-medium transition ${
                recordType === "absence"
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-200/75"
              }`}
            >
              Falta
            </button>
            <button
              onClick={() => setRecordType("makeup")}
              className={`py-2 px-3 rounded-md text-sm font-medium transition ${
                recordType === "makeup"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-200/75"
              }`}
            >
              Reposição
            </button>
          </div>

          {recordType === "absence" ? (
            <form onSubmit={handleSubmitAbsence} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Data</label>
                <input
                  type="date"
                  value={absenceDate}
                  onChange={(e) => setAbsenceDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Horas</label>
                <input
                  type="number"
                  value={absenceHours}
                  onChange={(e) => setAbsenceHours(e.target.value)}
                  required
                  min="1"
                  max="24"
                  placeholder="Ex: 8"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={absenceType}
                  onChange={(e) =>
                    setAbsenceType(
                      e.target.value as "ATESTADO" | "SEM_JUSTIFICATIVA" | "OUTRA"
                    )
                  }
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="SEM_JUSTIFICATIVA">Sem Justificativa</option>
                  <option value="ATESTADO">Atestado</option>
                  <option value="OUTRA">Outra</option>
                </select>
              </div>

              {absenceType === "OUTRA" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Justificativa
                  </label>
                  <input
                    type="text"
                    value={absenceReason}
                    onChange={(e) => setAbsenceReason(e.target.value)}
                    placeholder="Descreva o motivo da ausência"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition"
                >
                  {submitting ? "Salvando..." : "Salvar Falta"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitMakeup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Data</label>
                <input
                  type="date"
                  value={makeupDate}
                  onChange={(e) => setMakeupDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Horas Repostas
                </label>
                <input
                  type="number"
                  value={makeupHours}
                  onChange={(e) => setMakeupHours(e.target.value)}
                  required
                  min="1"
                  max="24"
                  placeholder="Ex: 12"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition"
                >
                  {submitting ? "Salvando..." : "Salvar Reposição"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
