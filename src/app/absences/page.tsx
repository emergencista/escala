import { redirect } from "next/navigation";
import AbsenceDashboard from "@/components/AbsenceDashboard";
import { getSession } from "@/lib/auth";

export default async function AbsencesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "RESIDENT") {
    redirect("/resident/shifts");
  }

  return <AbsenceDashboard />;
}