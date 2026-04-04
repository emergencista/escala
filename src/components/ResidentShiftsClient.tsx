"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { apiFetch } from "@/lib/fetch-helper";
import type { ResidentDashboardData } from "@/types/resident";

export default function ResidentShiftsClient({ resident }: { resident: ResidentDashboardData }) {
  const [logoutReady, setLogoutReady] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLogoutError(null);
    setLogoutReady(false);

    try {
      await apiFetch("/api/logout", { method: "POST", credentials: "include" });
      setLogoutReady(true);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setLogoutError("Não foi possível encerrar a sessão. Tente novamente.");
    }
  };

  return (
    <div className="ambient-shell min-h-screen overflow-x-hidden text-slate-900">
      <header className="hero-band sticky top-0 z-30 border-b border-white/10 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100 backdrop-blur">Área do residente</div>
            <h1 className="mt-3 text-lg font-black uppercase tracking-[0.24em] sm:text-[1.35rem]">Previsão de Reposição</h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
              R{resident.pgyLevel} • {resident.name}
            </p>
          </div>
          {logoutReady ? (
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Ir para login</span>
            </a>
          ) : (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </header>

      {logoutError ? (
        <div className="mx-auto mt-4 w-full max-w-6xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {logoutError}
        </div>
      ) : null}

      {logoutReady ? (
        <div className="mx-auto mt-4 w-full max-w-6xl rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Logout realizado. Clique em "Ir para login" para continuar.
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        <section className="glass-surface overflow-hidden rounded-[28px]">
          <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,255,255,0.9))] px-6 py-4">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-amber-900">Reposições Que Estão Por Vir</h2>
          </div>

          {resident.plannedMakeups.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              <div className="text-sm">Nenhuma reposição prevista no momento.</div>
              <p className="mt-2 text-xs text-slate-400">Você será notificado quando novas reposições forem programadas.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {resident.plannedMakeups.map((makeup) => {
                const date = new Date(makeup.date);
                const formattedDate = date.toLocaleDateString("pt-BR", {
                  weekday: "short",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                return (
                  <div key={makeup.id} className="px-6 py-4 sm:py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-bold leading-6 text-slate-900">{formattedDate}</div>
                        <div className="mt-1.5 text-sm leading-6 text-slate-600">
                          <span className="font-semibold">Turno:</span> {makeup.period === "SD" ? "Diurno (SD)" : "Noturno (SN)"}
                        </div>
                        {makeup.observation ? (
                          <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                            <span className="font-semibold">Observação:</span> {makeup.observation}
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-900 whitespace-nowrap">
                        +{makeup.hours}h
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">ℹ️ Informação</p>
          <p className="mt-1">
            As reposições previstas são agendadas pelos preceptores. Quando confirmadas, elas aparecerão no seu registro de reposições completadas.
          </p>
        </div>
      </main>
    </div>
  );
}