"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "escala-ui-version";

type VersionBusterProps = {
  version: string;
};

export default function VersionBuster({ version }: VersionBusterProps) {
  const [staleVersion, setStaleVersion] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const currentVersion = window.localStorage.getItem(STORAGE_KEY);

      setStaleVersion(Boolean(currentVersion && currentVersion !== version));
      setDismissed(false);
    } catch {
      // Private browsing or storage-disabled environments should still render.
    }
  }, [version]);

  if (!staleVersion || dismissed) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 max-w-xs rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-xs text-slate-600 shadow-lg backdrop-blur"
    >
      <p>Nova versão disponível. Recarregue a página manualmente para ver as mudanças.</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="pointer-events-auto mt-3 inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800"
      >
        Entendi
      </button>
    </div>
  );
}
