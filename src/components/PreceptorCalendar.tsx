"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CalendarEvent } from "@/types/calendar";

interface PreceptorCalendarProps {
  events: CalendarEvent[];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDate(dateStr: string, year: number, month: number, day: number): boolean {
  const parts = dateStr.split("T")[0].split("-");
  const eventYear = parseInt(parts[0], 10);
  const eventMonth = parseInt(parts[1], 10) - 1;
  const eventDay = parseInt(parts[2], 10);
  return eventYear === year && eventMonth === month && eventDay === day;
}

function formatTooltipLine(event: CalendarEvent) {
  return `${event.label}: ${event.residentName}${event.details ? ` · ${event.details}` : ""}`;
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
    return events.filter((event) => isSameDate(event.date, currentYear, currentMonth, day));
  };

  return (
    <div className="rounded-[30px] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Calendário de {monthName}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 transition hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <span className="min-w-max text-sm font-medium text-slate-600">{monthName}</span>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 transition hover:bg-slate-100"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-6 flex flex-wrap gap-4 rounded-lg bg-slate-50 p-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-red-500" />
          <span className="text-sm text-slate-600">Falta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-blue-500" />
          <span className="text-sm text-slate-600">Prevista</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-green-500" />
          <span className="text-sm text-slate-600">Confirmada</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Day of week headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div key={day} className="w-20 text-center text-xs font-semibold uppercase text-slate-500 sm:w-24">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const dayTone = day ? getDayTone(dayEvents) : "border-slate-100 bg-white text-slate-900";
              const tooltip = dayEvents.length > 0 ? dayEvents.map(formatTooltipLine).join("\n") : "";

              return (
                <button
                  key={index}
                  type="button"
                  title={tooltip}
                  className={`group relative flex w-20 flex-col justify-between rounded-lg border-2 p-2 text-left transition hover:-translate-y-[1px] hover:shadow-sm sm:w-24 ${
                    day ? `min-h-20 ${dayTone}` : "border-slate-100 bg-white text-slate-900"
                  }`}
                >
                  {day && (
                    <>
                      <div className="text-xs font-semibold">{day}</div>
                      {dayEvents.length > 0 ? (
                        <>
                          <div className="mt-2 self-start rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                            {dayEvents.length} evento{dayEvents.length > 1 ? "s" : ""}
                          </div>
                          <div className="pointer-events-none absolute left-1/2 bottom-full z-30 mb-2 w-56 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-medium text-slate-700 opacity-0 shadow-xl transition group-hover:opacity-100">
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Eventos</div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 3).map((event) => (
                                <div key={`${event.id}-${event.kind}`} className="leading-tight">
                                  {formatTooltipLine(event)}
                                </div>
                              ))}
                              {dayEvents.length > 3 ? <div className="text-[10px] font-semibold text-slate-500 mt-1">+{dayEvents.length - 3} outros</div> : null}
                            </div>
                          </div>
                        </>
                      ) : null}
                      <div className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-transparent transition group-hover:ring-2 group-hover:ring-slate-900/10" />
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info text */}
      <p className="mt-4 text-xs text-slate-500">Selecione um residente na lateral para ver detalhes dos eventos.</p>
    </div>
  );
}
