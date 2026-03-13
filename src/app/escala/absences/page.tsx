"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown, Plus, X } from "lucide-react";
import { format } from "date-fns";
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
  const [recordType, setRecordType] = useState<"absence" | "makeup">("absence");

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
    try {
      const res = await fetch("/escala/api/residents");
      if (res.ok) {
        const data = await res.json();
        // Sort by pgyLevel descending (R3, R2, R1)
        const sorted = data.sort((a: Resident, b: Resident) => b.pgyLevel - a.pgyLevel);
        setResidents(sorted);
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
          date: absenceDate,
          hours: parseInt(absenceHours),
          type: absenceType,
          reason: absenceReason || null,
        }),
      });

      if (res.ok) {
        // Refresh resident summary
        await handleResidentClick(selectedResident.resident);
        // Reset form
        setAbsenceDate("");
        setAbsenceHours("");
        setAbsenceReason("");
        setShowModal(false);
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
          date: makeupDate,
          hours: parseInt(makeupHours),
        }),
      });

      if (res.ok) {
        // Refresh resident summary
        await handleResidentClick(selectedResident.resident);
        // Reset form
        setMakeupDate("");
        setMakeupHours("");
        setShowModal(false);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Controle de Faltas</h1>
              <p className="mt-1 text-sm text-gray-600">Gerenciamento de ausências e reposições</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Residents List */}
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 h-fit sticky top-24">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="font-semibold text-gray-900">Residentes</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {residents.map((resident) => (
                <button
                  key={resident.id}
                  onClick={() => handleResidentClick(resident)}
                  className={`w-full px-4 py-3 text-left text-sm transition ${
                    selectedResident?.resident.id === resident.id
                      ? "bg-blue-50 text-blue-900 border-l-4 border-blue-500"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="font-medium">{resident.name}</div>
                  <div className="text-xs opacity-75">R{resident.pgyLevel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Resident Details */}
          {selectedResident ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                  <p className="text-sm font-medium text-gray-600">Horas de Falta</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">
                    {selectedResident.totalAbsenceHours}h
                  </p>
                </div>
                <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                  <p className="text-sm font-medium text-gray-600">Horas Repostas</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {selectedResident.totalMakeupHours}h
                  </p>
                </div>
                <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                  <p className="text-sm font-medium text-gray-600">Saldo</p>
                  <p
                    className={`mt-2 text-3xl font-bold ${
                      selectedResident.balanceHours > 0 ? "text-orange-600" : "text-gray-600"
                    }`}
                  >
                    {selectedResident.balanceHours}h
                  </p>
                </div>
              </div>

              {/* Add Record Button */}
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Adicionar Registro
              </button>

              {/* History Tabs */}
              <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <h3 className="font-semibold text-gray-900">Histórico</h3>
                </div>

                {selectedResident.absences.length === 0 &&
                selectedResident.makeups.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500">Nenhum registro encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Absences */}
                    {selectedResident.absences.length > 0 && (
                      <div className="border-b border-gray-200">
                        <div className="bg-red-50 px-6 py-3 border-b border-gray-200">
                          <h4 className="font-medium text-red-900">Faltas</h4>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {selectedResident.absences.map((absence) => (
                            <div
                              key={absence.id}
                              className="px-6 py-4 hover:bg-gray-50 transition"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {format(new Date(absence.date), "dd/MM/yyyy", {
                                      locale: ptBR,
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {absence.type === "ATESTADO"
                                      ? "Atestado"
                                      : absence.type === "SEM_JUSTIFICATIVA"
                                        ? "Sem Justificativa"
                                        : "Outra"}
                                    {absence.reason && ` - ${absence.reason}`}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-red-600">-{absence.hours}h</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Makeups */}
                    {selectedResident.makeups.length > 0 && (
                      <div>
                        <div className="bg-green-50 px-6 py-3 border-b border-gray-200">
                          <h4 className="font-medium text-green-900">Reposições</h4>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {selectedResident.makeups.map((makeup) => (
                            <div
                              key={makeup.id}
                              className="px-6 py-4 hover:bg-gray-50 transition"
                            >
                              <div className="flex items-start justify-between">
                                <p className="font-medium text-gray-900">
                                  {format(new Date(makeup.date), "dd/MM/yyyy", {
                                    locale: ptBR,
                                  })}
                                </p>
                                <div className="text-right">
                                  <p className="font-semibold text-green-600">+{makeup.hours}h</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-white p-12 shadow-sm border border-gray-200 text-center">
              <p className="text-gray-500">Selecione um residente para ver os detalhes</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
            {/* Modal Header */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {recordType === "absence" ? "Registrar Falta" : "Registrar Reposição"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Type Selector */}
              <div className="mb-6 flex gap-2 border-b border-gray-200 pb-4">
                <button
                  onClick={() => setRecordType("absence")}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                    recordType === "absence"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Falta
                </button>
                <button
                  onClick={() => setRecordType("makeup")}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                    recordType === "makeup"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Reposição
                </button>
              </div>

              {/* Forms */}
              {recordType === "absence" ? (
                <form onSubmit={handleSubmitAbsence} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data</label>
                    <input
                      type="date"
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                      required
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                        placeholder="Descreva o motivo"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition"
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
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition"
                    >
                      {submitting ? "Salvando..." : "Salvar Reposição"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
