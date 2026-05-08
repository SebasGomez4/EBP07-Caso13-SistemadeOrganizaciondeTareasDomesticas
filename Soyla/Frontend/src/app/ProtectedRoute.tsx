import { ReactNode } from "react";
import { Navigate } from "react-router";
import { getActiveSession } from "./lib/session";

interface ProtectedRouteProps {
  children: ReactNode;
  publicOnly?: boolean;
}

export function ProtectedRoute({ children, publicOnly = false }: ProtectedRouteProps) {
  const session = getActiveSession();
  const isAuthenticated = !!session;

  // Si es ruta solo para públicos (login/register) y el usuario está autenticado
  if (publicOnly && isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // Si es ruta protegida y el usuario no está autenticado
  if (!publicOnly && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
