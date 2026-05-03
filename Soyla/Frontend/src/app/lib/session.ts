import type { SessionUser } from "./api";

export const SESSION_TIMEOUT = 300000;

export interface CurrentSession {
  user: SessionUser;
  lastActivity: number;
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
    } satisfies CurrentSession)
  );
}

export function getActiveSession(): CurrentSession | null {
  const session = readSession();
  if (!session) {
    return null;
  }

  if (Date.now() - session.lastActivity >= SESSION_TIMEOUT) {
    clearSession();
    return null;
  }

  return session;
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
