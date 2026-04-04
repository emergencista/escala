import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/fetch-helper";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await apiFetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.session);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const logout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return { user, loading, logout };
}
