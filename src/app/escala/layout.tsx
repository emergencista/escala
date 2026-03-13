import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Escala Médica - Controle de Faltas",
  description: "Sistema de controle de faltas e reposições para médicos residentes",
};

export default function EscalaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
