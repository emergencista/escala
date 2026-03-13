"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isWithinInterval, parse, startOfDay, endOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { CheckCircle2, XCircle, AlertCircle, Clock, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

// ============= CUSTOM HOOK: useTurnoAtual =============
const useTurnoAtual = () => {
  const [turnoInfo, setTurnoInfo] = useState({
    tipo: "Plantão Diurno",
    horario: "07h - 19h",
    data: format(new Date(), "dd/MM/yyyy"),
  });

  useEffect(() => {
    const atualizar = () => {
      const agora = new Date();
      const hora = agora.getHours();

      let tipo: string;
      let horario: string;
      let data: string;

      if (hora >= 7 && hora < 19) {
        /* Diurno: 07:00 - 18:59 */
        tipo = "Plantão Diurno";
        horario = "07h - 19h";
        data = format(agora, "dd/MM/yyyy");
      } else {
        /* Noturno: 19:00 - 06:59 */
        tipo = "Plantão Noturno";
        horario = "19h - 07h";
        const dataInicio = hora >= 19 ? agora : new Date(agora.getTime() - 24 * 60 * 60 * 1000);
        data = format(dataInicio, "dd/MM/yyyy");
      }

      setTurnoInfo({ tipo, horario, data });
    };

    atualizar();
    const intervalo = setInterval(atualizar, 60000);
    return () => clearInterval(intervalo);
  }, []);

  return turnoInfo;
};

// ============= TOAST NOTIFICATION COMPONENT =============
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-emerald-50" : "bg-red-50";
  const textColor = type === "success" ? "text-emerald-900" : "text-red-900";
  const borderColor = type === "success" ? "border-emerald-200" : "border-red-200";

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${bgColor} ${textColor} ${borderColor} animate-in fade-in slide-in-from-bottom-4`}>
      {message}
    </div>
  );
};

// ============= MOCK DATA =============
const MOCK_RESIDENTES = [
  { id: "1", name: "Alice Silva", pgyLevel: 1 },
  { id: "2", name: "Bruno Costa", pgyLevel: 2 },
  { id: "3", name: "Carla Souza", pgyLevel: 3 },
  { id: "4", name: "Daniel Oliveira", pgyLevel: 1 },
  { id: "5", name: "Elisa Ferreira", pgyLevel: 2 },
  { id: "6", name: "Felipe Santos", pgyLevel: 3 },
];

const MOCK_HORAS_MES = [
  { name: "Alice Silva", horas: 95, meta: 120 },
  { name: "Bruno Costa", horas: 112, meta: 120 },
  { name: "Carla Souza", horas: 128, meta: 120 },
  { name: "Daniel Oliveira", horas: 89, meta: 120 },
  { name: "Elisa Ferreira", horas: 135, meta: 120 },
  { name: "Felipe Santos", horas: 118, meta: 120 },
];

// ============= STATUS OPTIONS =============
const statusOptions = [
  { label: "Presente", value: "PRESENTE", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
  { label: "Falta", value: "FALTA", icon: XCircle, color: "bg-red-100 text-red-700 hover:bg-red-200" },
  { label: "Falta Justificada", value: "FALTA_JUSTIFICADA", icon: AlertCircle, color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
];

// ============= TYPES =============
type Resident = {
  id: string;
  name: string;
  pgyLevel: number;
};

type Shift = {
  id: string;
  status: string;
  type: string;
  date: string;
  resident: Resident;
};

type ShiftsResponse = {
  shifts: Shift[];
  shiftType: string;
  date: string;
};

// ============= MAIN COMPONENT =============
export default function EscalaDashboard() {
  const turnoAtual = useTurnoAtual();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState({ name: "", pgyLevel: "1" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  const shiftMap = useMemo(() => {
    return new Map(shifts.map((shift) => [shift.resident.id, shift]));
  }, [shifts]);

  // Ordenar residentes alfabeticamente
  const sortedResidents = useMemo(() => {
    return [...residents].sort((a, b) => a.name.localeCompare(b.name));
  }, [residents]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resReq, shiftsReq] = await Promise.all([
        fetch("/api/residents", { cache: "no-store" }),
        fetch("/api/shifts", { cache: "no-store" }),
      ]);

      const residentsData = await resReq.json();
      const shiftsData: ShiftsResponse = await shiftsReq.json();

      setResidents(residentsData);
      setShifts(shiftsData.shifts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatus = async (residentId: string, status: string) => {
    setLoading(true);
    try {
      await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ residentId, status }),
      });
      await loadData();
      setToast({ message: "Status atualizado com sucesso", type: "success" });
    } catch (error) {
      setToast({ message: "Erro ao atualizar status", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddResident = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name,
          pgyLevel: Number(formState.pgyLevel),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        setToast({ message: error?.error ?? "Erro ao criar residente", type: "error" });
      } else {
        setToast({ message: "Residente criado com sucesso", type: "success" });
        setFormState({ name: "", pgyLevel: "1" });
        await loadData();
      }
    } catch (error) {
      setToast({ message: "Erro ao criar residente", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{turnoAtual.tipo}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {turnoAtual.horario} • {turnoAtual.data}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Lançamento Rápido</span>
              </div>
              {user && (
                <div className="flex items-center gap-3 rounded-lg bg-gray-100 px-4 py-2">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-600">{user.role === "ADMIN" ? "Administrador" : "Usuário"}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg bg-red-100 p-2 text-red-600 transition hover:bg-red-200"
                    title="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========== TOAST ========== */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ========== MAIN CONTENT ========== */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ========== SECTION 1: PAINEL DE LANÇAMENTO RÁPIDO ========== */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Residentes em Turno</h2>
            <p className="mt-1 text-sm text-slate-600">Selecione o status de presença para cada residente</p>
          </div>

          {loading && residents.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl bg-white py-12">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                <p className="text-sm text-slate-600">Carregando residentes...</p>
              </div>
            </div>
          ) : residents.length === 0 ? (
            <div className="rounded-xl bg-white px-6 py-12 text-center">
              <p className="text-sm text-slate-600">Nenhum residente cadastrado. Adicione um residente no formulário abaixo.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {sortedResidents.map((resident) => {
                const shift = shiftMap.get(resident.id);
                return (
                  <div
                    key={resident.id}
                    className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    {/* Resident Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{resident.name}</p>
                      <p className="text-xs text-slate-500">
                        {resident.pgyLevel}º Ano • Status:{" "}
                        <span className="font-medium">
                          {shift?.status === "PRESENTE"
                            ? "✓ Presente"
                            : shift?.status === "FALTA"
                              ? "✗ Falta"
                              : shift?.status === "FALTA_JUSTIFICADA"
                                ? "! Falta Justificada"
                                : "Sem registro"}
                        </span>
                      </p>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                      {statusOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = shift?.status === option.value;
                        return (
                          <button
                            key={option.value}
                            disabled={loading}
                            onClick={() => handleStatus(resident.id, option.value)}
                            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
                              isSelected
                                ? `${option.color.split(" ").slice(0, 2).join(" ")} ring-2 ring-offset-2 ring-offset-white`
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========== SECTION 2: FORMULÁRIO + GRÁFICO ========== */}
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Gráfico de Horas do Mês */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Horas Cumpridas (Mês)</h2>
              <p className="mt-1 text-sm text-slate-600">Acompanhamento mensal de horas trabalhadas vs. meta</p>
            </div>

            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MOCK_HORAS_MES}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="name" type="category" width={115} tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => `${value}h`}
                  />
                  <Legend />
                  <ReferenceLine
                    x={120}
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    label={{ value: "Meta: 120h", position: "insideBottom", dy: 10, fill: "#f59e0b" }}
                  />
                  <Bar dataKey="horas" fill="#3b82f6" name="Horas" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Cards */}
            <div className="mt-6 grid gap-4 border-t border-gray-200 pt-6 sm:grid-cols-3">
              {[
                { label: "Acima da Meta", count: 2, color: "text-emerald-700 bg-emerald-50" },
                { label: "No Alvo", count: 2, color: "text-blue-700 bg-blue-50" },
                { label: "Abaixo da Meta", count: 2, color: "text-red-700 bg-red-50" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-lg p-4 ${stat.color}`}>
                  <p className="font-semibold">{stat.count}</p>
                  <p className="text-xs opacity-75">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Formulário Adicionar Residente */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Adicionar Residente</h2>
            <p className="mb-6 text-sm text-slate-600">Registre um novo residente na escala</p>

            <form onSubmit={handleAddResident} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-slate-700">
                  Nome Completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  required
                  placeholder="Digite o nome"
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="pgy" className="block text-xs font-medium text-slate-700">
                  Ano de Residência
                </label>
                <select
                  id="pgy"
                  value={formState.pgyLevel}
                  onChange={(e) => setFormState({ ...formState, pgyLevel: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="1">1º Ano</option>
                  <option value="2">2º Ano</option>
                  <option value="3">3º Ano</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !formState.name.trim()}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Adicionando..." : "Adicionar Residente"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
