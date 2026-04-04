"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { APP_VERSION } from "@/lib/appVersion";

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const styles = {
    shell: {
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      padding: "2rem 1rem",
      background: "radial-gradient(circle at top left, #e0f2fe, #f8fafc 35%, #e2e8f0 100%)",
    },
    orb: {
      position: "absolute",
      borderRadius: "9999px",
      filter: "blur(48px)",
      pointerEvents: "none",
    },
    orbLeft: {
      left: "-5rem",
      top: "-5rem",
      height: "16rem",
      width: "16rem",
      background: "rgba(125, 211, 252, 0.35)",
    },
    orbRight: {
      right: "-4rem",
      bottom: "-6rem",
      height: "18rem",
      width: "18rem",
      background: "rgba(203, 213, 225, 0.35)",
    },
    card: {
      position: "relative",
      zIndex: 1,
      width: "min(100%, 520px)",
      overflow: "hidden",
      border: "1px solid rgba(255, 255, 255, 0.7)",
      borderRadius: "30px",
      background: "rgba(255, 255, 255, 0.86)",
      padding: "1.5rem",
      boxShadow: "0 28px 80px rgba(15, 23, 42, 0.2)",
      backdropFilter: "blur(20px)",
    },
    header: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "1rem",
      marginBottom: "2rem",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      borderRadius: "9999px",
      border: "1px solid #bae6fd",
      background: "#f0f9ff",
      padding: "0.35rem 0.75rem",
      color: "#0369a1",
      fontSize: "0.72rem",
      fontWeight: 700,
      letterSpacing: "0.14em",
      textTransform: "uppercase" as const,
    },
    title: {
      margin: "0.85rem 0 0",
      color: "#0f172a",
      fontSize: "clamp(2rem, 4vw, 2.4rem)",
      fontWeight: 900,
      letterSpacing: "0.03em",
    },
    subtitle: {
      margin: "0.5rem 0 0",
      color: "#475569",
      fontSize: "0.95rem",
      lineHeight: 1.5,
    },
    logoWrap: {
      flex: "0 0 auto",
      borderRadius: "1rem",
      border: "1px solid #e0f2fe",
      background: "#fff",
      padding: "0.5rem",
      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
    },
    logo: {
      display: "block",
      width: "48px",
      height: "48px",
      borderRadius: "0.9rem",
      objectFit: "cover" as const,
    },
    form: {
      display: "grid",
      gap: "1rem",
    },
    fieldLabel: {
      display: "block",
      marginBottom: "0.45rem",
      color: "#334155",
      fontSize: "0.92rem",
      fontWeight: 700,
    },
    input: {
      width: "100%",
      border: "1px solid #cbd5e1",
      borderRadius: "1rem",
      background: "rgba(255, 255, 255, 0.94)",
      color: "#0f172a",
      padding: "0.9rem 1rem",
      fontSize: "1rem",
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
      outline: "none",
    },
    error: {
      border: "1px solid #fecaca",
      borderRadius: "1rem",
      background: "#fef2f2",
      color: "#b91c1c",
      padding: "0.8rem 1rem",
      fontSize: "0.95rem",
      fontWeight: 600,
    },
    success: {
      border: "1px solid #bbf7d0",
      borderRadius: "1rem",
      background: "#f0fdf4",
      color: "#166534",
      padding: "0.8rem 1rem",
      fontSize: "0.95rem",
      fontWeight: 600,
    },
    submit: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      width: "100%",
      border: "none",
      borderRadius: "1rem",
      background: "#0f172a",
      color: "#fff",
      padding: "0.95rem 1rem",
      fontSize: "0.95rem",
      fontWeight: 700,
      cursor: "pointer",
    },
    continueLink: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      width: "100%",
      borderRadius: "1rem",
      background: "#14532d",
      color: "#fff",
      padding: "0.95rem 1rem",
      fontSize: "0.95rem",
      fontWeight: 700,
      textDecoration: "none",
    },
    submitIcon: {
      width: "1rem",
      height: "1rem",
    },
  } as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedIdentifier = identifier.trim();
    const normalizedPassword = password.trim();

    if (!normalizedIdentifier || !normalizedPassword) {
      setError("Informe login e senha.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch("/escala/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedIdentifier, password: normalizedPassword }),
        credentials: "include",
        signal: controller.signal,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      const role = String(data?.user?.role || "").toUpperCase();
      const destination = role === "RESIDENT" ? "/escala/resident/shifts" : "/escala/absences";
      setNextPath(`${destination}?v=${APP_VERSION}`);
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof DOMException && err.name === "AbortError" ? "O login demorou demais. Tente novamente." : "Erro ao fazer login. Tente novamente.");
      setLoading(false);
    } finally {
      window.clearTimeout(timeoutId);
      controller.abort();
      setLoading(false);
    }
  };

  return (
    <div style={styles.shell}>
      <div style={{ ...styles.orb, ...styles.orbLeft }} />
      <div style={{ ...styles.orb, ...styles.orbRight }} />

      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={styles.badge}>PRME HMS</div>
            <h1 style={styles.title}>Escala Medica</h1>
            <p style={styles.subtitle}>Acesso de residentes e preceptores.</p>
          </div>
          <div style={styles.logoWrap}>
            {logoFailed ? (
              <div
                aria-hidden="true"
                style={{
                  ...styles.logo,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #e0f2fe, #f8fafc)",
                  color: "#0f172a",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                HMS
              </div>
            ) : (
              <img
                src={`/escala/icon.png?v=${APP_VERSION}`}
                alt="Icone Escala"
                style={styles.logo}
                onError={() => setLogoFailed(true)}
              />
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label htmlFor="identifier" style={styles.fieldLabel}>
              Login ou email
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              placeholder="Digite seu login ou email"
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div>
            <label htmlFor="password" style={styles.fieldLabel}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Sua senha"
              disabled={loading}
              style={styles.input}
            />
          </div>

          {error ? <div style={styles.error}>{error}</div> : null}

          {nextPath ? <div style={styles.success}>Login realizado com sucesso. Clique abaixo para continuar.</div> : null}

          <button type="submit" disabled={loading || Boolean(nextPath)} style={styles.submit}>
            <LogIn style={styles.submitIcon} />
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {nextPath ? (
            <a href={nextPath} style={styles.continueLink}>
              Continuar
            </a>
          ) : null}
        </form>
      </div>
    </div>
  );
}
