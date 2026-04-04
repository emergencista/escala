import { redirect } from "next/navigation";
import AbsenceDashboard from "@/components/AbsenceDashboard";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AbsencesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (session.role === "RESIDENT") {
    redirect("/resident/shifts");
  }

  return <AbsenceDashboard />;
}