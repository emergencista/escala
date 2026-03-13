"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, AlertCircle, Loader } from "lucide-react";

interface Shift {
  id: string;
  date: string;
  type: "DIURNO" | "NOTURNO";
  status: "ESCALADO" | "PRESENTE" | "FALTA" | "FALTA_JUSTIFICADA";
}

interface ResidentData {
  name: string;
  pgyLevel: number;
  shifts: Shift[];
  totalAbsenceHours: number;
}

export default function ResidentShiftsPage() {
  const router = useRouter();
  const [resident, setResident] = useState<ResidentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResidentData = async () => {
      try {
        const response = await fetch("/escala/api/resident/shifts");
        if (response.status === 401) {
          router.push("/escala/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Erro ao carregar dados");
        }
        const data = await response.json();
        setResident(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchResidentData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/escala/api/logout", { method: "POST" });
      router.push("/escala/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
            <div>
              <h2 className="font-semibold text-red-900">Erro</h2>
              <p className="mt-1 text-sm text-red-700">
                {error || "Não foi possível carregar seus dados"}
              </p>
              <button
                onClick={() => router.push("/escala/login")}
                className="mt-4 text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                Voltar para login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const absencesCount = resident.shifts.filter(
    (s) => s.status === "FALTA" || s.status === "FALTA_JUSTIFICADA"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-blue-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Minhas Faltas</h1>
              <p className="mt-1 text-sm text-gray-600">
                R{resident.pgyLevel} • {resident.name}
              </p>
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

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Faltas</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {absencesCount}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Horas</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {resident.totalAbsenceHours}h
                </p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <svg
                  className="h-6 w-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Shifts Table */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Histórico de Faltas</h2>
          </div>

          {resident.shifts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Nenhum registro de falta</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resident.shifts.map((shift, index) => {
                    const date = new Date(shift.date);
                    const statusColors: Record<string, string> = {
                      ESCALADO: "bg-blue-100 text-blue-800",
                      PRESENTE: "bg-green-100 text-green-800",
                      FALTA: "bg-red-100 text-red-800",
                      FALTA_JUSTIFICADA: "bg-amber-100 text-amber-800",
                    };

                    const statusLabel: Record<string, string> = {
                      ESCALADO: "Escalado",
                      PRESENTE: "Presente",
                      FALTA: "Falta",
                      FALTA_JUSTIFICADA: "Falta Justificada",
                    };

                    return (
                      <tr
                        key={shift.id}
                        className={`border-b border-gray-200 hover:bg-gray-50 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {date.toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {shift.type === "DIURNO" ? "Diurno" : "Noturno"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              statusColors[shift.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {statusLabel[shift.status] || shift.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
