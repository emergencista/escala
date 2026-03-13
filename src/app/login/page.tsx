"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/escala/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      // Use window.location for redirect to ensure page loads
      window.location.href = "/escala";
    } catch (err) {
      console.error("Login error:", err);
      setError("Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-lg bg-blue-100 p-3">
              <LogIn className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Escala Médica</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sistema de Gerenciamento de Plantões
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Sua senha"
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 rounded-lg bg-blue-50 p-4 border border-blue-200">
          <p className="mb-3 text-xs font-semibold uppercase text-blue-700">
            Credenciais de Demo
          </p>
          <div className="space-y-2 text-xs text-blue-700">
            <div>
              <p className="font-medium">Admin:</p>
              <p>admin@escala.local / Admin@123456</p>
            </div>
            <div>
              <p className="font-medium">Usuário:</p>
              <p>usuario@escala.local / Usuario@123456</p>
            </div>
            <div>
              <p className="font-medium">Preceptor:</p>
              <p>preceptor@escala.local / Preceptor@123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
