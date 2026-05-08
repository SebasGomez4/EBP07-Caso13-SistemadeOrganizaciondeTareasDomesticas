import type { SessionUser } from "./api";

export const SESSION_TIMEOUT = 300000; // 5 minutos
export const TOKEN_CHECK_INTERVAL = 60000; // 1 minuto

export interface CurrentSession {
  user: SessionUser;
  lastActivity: number;
  tokenExpiry?: number;
}

export function readSession(): CurrentSession | null {
  const raw = localStorage.getItem("currentSession");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CurrentSession;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(user: SessionUser): CurrentSession {
  const session: CurrentSession = {
    user,
    lastActivity: Date.now(),
    tokenExpiry: calculateTokenExpiry(user.token),
  };
  localStorage.setItem("currentSession", JSON.stringify(session));
  return session;
}

export function touchSession(): CurrentSession | null {
  const session = readSession();
  if (!session) {
    return null;
  }

  const updated: CurrentSession = {
    ...session,
    lastActivity: Date.now(),
  };
  localStorage.setItem("currentSession", JSON.stringify(updated));
  return updated;
}

export function updateSessionUser(user: SessionUser): void {
  const session = readSession();
  if (!session) {
    return;
  }

  localStorage.setItem(
    "currentSession",
    JSON.stringify({
      ...session,
      user,
      lastActivity: Date.now(),
      tokenExpiry: calculateTokenExpiry(user.token),
    } satisfies CurrentSession)
  );
}

export function getActiveSession(): CurrentSession | null {
  const session = readSession();
  if (!session) {
    return null;
  }

  // Verificar timeout de inactividad
  if (Date.now() - session.lastActivity >= SESSION_TIMEOUT) {
    clearSession();
    return null;
  }

  // Verificar expiración del token
  if (session.tokenExpiry && Date.now() >= session.tokenExpiry) {
    clearSession();
    return null;
  }

  return session;
}

export function isTokenExpiringSoon(): boolean {
  const session = readSession();
  if (!session || !session.tokenExpiry) {
    return false;
  }

  const timeUntilExpiry = session.tokenExpiry - Date.now();
  const expiryThreshold = 5 * 60 * 1000; // Alertar 5 minutos antes de expirar

  return timeUntilExpiry > 0 && timeUntilExpiry <= expiryThreshold;
}

export function getTokenExpiryTime(): number | null {
  const session = readSession();
  return session?.tokenExpiry ?? null;
}

export function clearSession(): void {
  localStorage.removeItem("currentSession");
  localStorage.removeItem("loginAttempts");
  localStorage.removeItem("loginLockout");
  sessionStorage.removeItem("loginSuccess");
}

export function markLogoutSuccess(): void {
  sessionStorage.setItem("logoutSuccess", "true");
}

function calculateTokenExpiry(token: string): number {
  try {
    // JWT tiene 3 partes separadas por puntos: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      return Date.now() + 3600 * 1000; // Asumir 1 hora si no es válido
    }

    // Decodificar el payload (segunda parte)
    const payload = JSON.parse(atob(parts[1])) as { exp?: number };

    // exp está en segundos, convertir a milisegundos
    return (payload.exp || Math.floor(Date.now() / 1000) + 3600) * 1000;
  } catch {
    // Si hay error decodificando, asumir 1 hora
    return Date.now() + 3600 * 1000;
  }
}
