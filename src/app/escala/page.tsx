"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EscalaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/escala/absences");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}
