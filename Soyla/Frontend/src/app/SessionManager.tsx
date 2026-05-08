import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getActiveSession, clearSession, isTokenExpiringSoon, getTokenExpiryTime, SESSION_TIMEOUT, TOKEN_CHECK_INTERVAL } from "./lib/session";
import { Alert, AlertDescription } from "./components/ui/alert";
import { AlertCircle } from "lucide-react";

export function SessionManager({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Verificar sesión activa al montar
    if (!getActiveSession()) {
      clearSession();
      navigate("/");
      return;
    }

    // Actualizar actividad del usuario en cada evento
    const handleUserActivity = () => {
      const session = getActiveSession();
      if (session) {
        // Touch session to update lastActivity
        const raw = localStorage.getItem("currentSession");
        if (raw) {
          try {
            const current = JSON.parse(raw);
            localStorage.setItem(
              "currentSession",
              JSON.stringify({
                ...current,
                lastActivity: Date.now(),
              })
            );
          } catch {
            // Ignore parse errors
          }
        }
      }
    };

    // Listeners para detectar actividad
    document.addEventListener("mousedown", handleUserActivity);
    document.addEventListener("keydown", handleUserActivity);
    document.addEventListener("scroll", handleUserActivity, true);

    // Intervalo para verificar expiración del token
    const checkInterval = setInterval(() => {
      const session = getActiveSession();

      if (!session) {
        clearSession();
        navigate("/");
        return;
      }

      if (isTokenExpiringSoon()) {
        setShowWarning(true);

        // Calcular tiempo restante
        const expiryTime = getTokenExpiryTime();
        if (expiryTime) {
          const remaining = Math.max(0, expiryTime - Date.now());
          setTimeRemaining(Math.ceil(remaining / 1000));
        }
      }
    }, TOKEN_CHECK_INTERVAL);

    return () => {
      document.removeEventListener("mousedown", handleUserActivity);
      document.removeEventListener("keydown", handleUserActivity);
      document.removeEventListener("scroll", handleUserActivity, true);
      clearInterval(checkInterval);
    };
  }, [navigate]);

  // Temporizador para decrementar el tiempo mostrado
  useEffect(() => {
    if (!showWarning || timeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearSession();
          navigate("/");
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showWarning, timeRemaining, navigate]);

  return (
    <>
      {showWarning && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tu sesión está próxima a expirar en {timeRemaining} segundos. Se cerrará automáticamente.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {children}
    </>
  );
}
