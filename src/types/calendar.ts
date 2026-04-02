export type CalendarEventKind = "absence" | "planned" | "confirmed";

export interface CalendarEvent {
  id: string;
  date: string;
  kind: CalendarEventKind;
  residentName: string;
  residentPgyLevel: number;
  label: string;
  details: string;
  hours: number;
}