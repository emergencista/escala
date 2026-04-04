import { redirect } from "next/navigation";
import LoginScreen from "@/components/LoginScreen";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  // Se está autenticado como residente, ir para shifts
  if (session && session.role === "RESIDENT") {
    redirect("/resident/shifts");
  }

  // Se é um usuário administrativo, ir para absences
  if (session) {
    redirect("/absences");
  }

  // Não autenticado: mostrar tela de login
  return <LoginScreen />;
}
