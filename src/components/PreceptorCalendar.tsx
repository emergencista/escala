"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CalendarEvent } from "@/types/calendar";

interface PreceptorCalendarProps {
  events: CalendarEvent[];
}

interface SelectedDayPayload {
  dateLabel: string;
  items: CalendarEvent[];
}

function parseDateParts(value?: string | null): { year: number; month: number; day: number } | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const raw = value.split("T")[0] || value;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return { year, month, day };
}

function buildDayLabel(year: number, month: number, day: number): string {
  const safeDate = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(safeDate.getTime())) {
    return `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
  }

  return safeDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDate(dateStr: string, year: number, month: number, day: number): boolean {
  const parsed = parseDateParts(dateStr);
  if (!parsed) {
    return false;
  }

  return parsed.year === year && parsed.month - 1 === month && parsed.day === day;
}

function getDayTone(events: CalendarEvent[]) {
  if (events.some((event) => event.kind === "absence")) {
    return "border-red-200 bg-red-50/90 text-red-900";
  }
  if (events.some((event) => event.kind === "planned")) {
    return "border-blue-200 bg-blue-50/90 text-blue-900";
  }
  if (events.some((event) => event.kind === "confirmed")) {
    return "border-green-200 bg-green-50/90 text-green-900";
  }

  return "border-slate-100 bg-slate-50 text-slate-900";
}

export default function PreceptorCalendar({ events }: PreceptorCalendarProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<SelectedDayPayload | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysArray: Array<number | null> = [
    ...Array.from({ length: firstDay }, () => null as null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Get events for this month
  const getEventsForDay = (day: number) => {
    return events.filter((event) => event && isSameDate(event.date, currentYear, currentMonth, day));
  };

  function handleDayClick(day: number | null) {
    if (!day) {
      return;
    }

    const items = getEventsForDay(day);
    const dateLabel = buildDayLabel(currentYear, currentMonth, day);
    setSelectedDay({ dateLabel, items });
  }

  return (
    <div className="relative w-full min-w-0 overflow-visible rounded-[28px] border border-slate-300/80 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-3 overflow-x-auto">
        <h3 className="text-base font-black tracking-[0.02em] text-slate-900">Calendário de {monthName}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 transition hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <span className="min-w-max text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">{monthName}</span>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 transition hover:bg-slate-100"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3 rounded-lg bg-slate-50 p-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-red-500" />
          <span className="text-xs font-medium text-slate-600">falta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-blue-500" />
          <span className="text-xs font-medium text-slate-600">reposição prevista</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-green-500" />
          <span className="text-xs font-medium text-slate-600">reposição realizada</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative isolate">
        {/* Day of week headers */}
        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
            <div key={day} className="text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="relative z-0 grid grid-cols-7 gap-1 overflow-visible">
          {daysArray.map((day, index) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const dayTone = day ? getDayTone(dayEvents) : "border-slate-100 bg-white text-slate-900";

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleDayClick(day)}
                className={`group relative z-0 flex min-h-[78px] w-full flex-col justify-between rounded-lg border-2 p-1.5 text-left transition hover:z-20 hover:-translate-y-[1px] hover:shadow-sm focus-visible:z-20 ${
                  day ? `${dayTone}` : "border-slate-100 bg-white text-slate-900"
                }`}
                disabled={!day}
              >
                {day && (
                  <>
                    {dayEvents.length > 0 ? (
                      <div className="pointer-events-none absolute left-1/2 top-0 z-30 hidden w-[220px] -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-xl border border-slate-200 bg-white/95 p-2 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 xl:block">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Eventos do dia</div>
                        <div className="space-y-1.5">
                          {dayEvents.map((event, idx) => {
                            const kind = event?.kind || "planned";
                            const tone =
                              kind === "absence"
                                ? "bg-red-500"
                                : kind === "confirmed"
                                  ? "bg-green-500"
                                  : "bg-blue-500";
                            const safeLabel = event?.label || "Evento";
                            const safeResident = event?.residentName || "Residente";

                            return (
                              <div key={`${event?.id || "event"}-${idx}`} className="flex items-center gap-2 text-[11px] text-slate-700">
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone}`} />
                                <span className="truncate font-medium">{safeLabel}: {safeResident}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    <div className="text-xs font-semibold">{day}</div>
                    {dayEvents.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {dayEvents.slice(0, 6).map((event, idx) => {
                          const kind = event?.kind || "planned";
                          const tone =
                            kind === "absence"
                              ? "bg-red-500"
                              : kind === "confirmed"
                                ? "bg-green-500"
                                : "bg-blue-500";

                          return <span key={`${event?.id || "dot"}-${idx}`} className={`h-1.5 w-4 rounded-full ${tone}`} />;
                        })}
                      </div>
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-transparent transition group-hover:ring-2 group-hover:ring-slate-900/10" />
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info text */}
      <p className="mt-3 text-[11px] text-slate-500">Selecione um residente na lateral para ver detalhes dos eventos.</p>

      {selectedDay ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 pt-6 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg max-h-[calc(100dvh-3rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Eventos do dia</div>
                <h4 className="mt-2 text-base font-bold text-slate-900 capitalize">{selectedDay.dateLabel}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
            <div className="max-h-[calc(100dvh-12rem)] space-y-2 overflow-y-auto px-5 py-4">
              {selectedDay.items.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">Sem eventos nesta data.</div>
              ) : (
                selectedDay.items.map((event, index) => {
                  const safeLabel = event?.label || "Evento";
                  const safeResident = event?.residentName || "Residente";
                  const safeDetails = event?.details || "Sem detalhes";
                  const kind = event?.kind || "planned";

                  return (
                    <div key={`${event?.id || "event"}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{safeLabel}: {safeResident}</div>
                          <div className="mt-1 text-xs text-slate-600">{safeDetails}</div>
                        </div>
                        <div
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            kind === "absence"
                              ? "bg-red-100 text-red-700"
                              : kind === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {kind === "absence" ? `-${event?.hours || 0}h` : `+${event?.hours || 0}h`}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
