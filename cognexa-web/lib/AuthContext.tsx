"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMe, getToken, clearToken } from "@/lib/api";

interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_EXACT_ROUTES = ["/", "/login", "/contact"];
const PUBLIC_ROUTE_PREFIXES = ["/docs", "/solutions", "/resources", "/community"];
const IDLE_LIMIT_MS = 60 * 60 * 1000; // 1 hour
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_EXACT_ROUTES.includes(pathname) ||
    PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const lastActivityRef = useRef(Date.now());

  function logout() {
    clearToken();
    setUser(null);
    router.replace("/login");
  }

  async function refreshUser() {
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      // ignore — a failed refresh keeps the existing user state
    }
  }

  useEffect(() => {
    const isPublic = isPublicRoute(pathname);
    const token = getToken();

    if (!token) {
      setLoading(false);
      if (!isPublic) router.replace("/login");
      return;
    }

    getMe()
      .then((me) => setUser(me))
      .catch(() => {
        clearToken();
        if (!isPublic) router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [pathname]);

  // Auto-logout after 1 hour of no mouse/keyboard/touch activity.
  useEffect(() => {
    if (!user) return;

    function markActive() {
      lastActivityRef.current = Date.now();
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActive));

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_LIMIT_MS) {
        logout();
      }
    }, 30_000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive));
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
