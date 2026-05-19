import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { SecurityIndicator } from "../components/SecurityIndicator";

interface User {
  fullName: string;
  email: string;
  password: string;
  status: "pending" | "active"; // HU 1.1.2
  createdAt: number;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30000; // 30 segundos
const SESSION_TIMEOUT = 300000; // 5 minutos de inactividad

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showLogoutToast, setShowLogoutToast] = useState(false);

  // Verificar si ya existe una sesión activa
  useEffect(() => {
    // Mostrar toast si viene de un cierre de sesión exitoso
    if (sessionStorage.getItem("logoutSuccess") === "true") {
      sessionStorage.removeItem("logoutSuccess");
      setShowLogoutToast(true);
      setTimeout(() => setShowLogoutToast(false), 3500);
    }

    const session = localStorage.getItem("currentSession");
    if (session) {
      const sessionData = JSON.parse(session);
      const now = Date.now();
      
      // Verificar si la sesión ha expirado
      if (now - sessionData.lastActivity < SESSION_TIMEOUT) {
        navigate("/home");
      } else {
        // Sesión expirada
        localStorage.removeItem("currentSession");
      }
    }
  }, [navigate]);

  // Verificar si la cuenta está bloqueada
  useEffect(() => {
    const lockout = localStorage.getItem("loginLockout");
    if (lockout) {
      const lockoutData = JSON.parse(lockout);
      const now = Date.now();
      const timeRemaining = LOCKOUT_DURATION - (now - lockoutData.timestamp);

      if (timeRemaining > 0) {
        setIsLocked(true);
        setLockoutTime(Math.ceil(timeRemaining / 1000));
        
        const interval = setInterval(() => {
          const newTimeRemaining = LOCKOUT_DURATION - (Date.now() - lockoutData.timestamp);
          if (newTimeRemaining <= 0) {
            setIsLocked(false);
            setLockoutTime(0);
            localStorage.removeItem("loginLockout");
            clearInterval(interval);
          } else {
            setLockoutTime(Math.ceil(newTimeRemaining / 1000));
          }
        }, 1000);

        return () => clearInterval(interval);
      } else {
        localStorage.removeItem("loginLockout");
      }
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Verificar si está bloqueado
    if (isLocked) {
      setError(`Cuenta bloqueada temporalmente. Intenta de nuevo en ${lockoutTime} segundos.`);
      return;
    }

    // Validación de campos vacíos (mensaje genérico)
    if (!email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos");
      return;
    }

    setLoading(true);

    // Simular tiempo de respuesta del servidor
    setTimeout(() => {
      const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u: User) => u.email === email);

      // Validación de credenciales (mensaje genérico para no revelar información)
      if (!user || user.password !== password) {
        handleFailedAttempt();
        setError("Credenciales incorrectas");
        setLoading(false);
        return;
      }

      // ── HU 1.1.2: Verificar si la cuenta está activada ──
      if (user.status === "pending") {
        setError("Tu cuenta aún no ha sido activada. Por favor, revisa tu correo electrónico y confirma tu registro.");
        setLoading(false);
        return;
      }

      // Login exitoso
      const sessionData = {
        user: {
          fullName: user.fullName,
          email: user.email,
        },
        lastActivity: Date.now(),
      };

      localStorage.setItem("currentSession", JSON.stringify(sessionData));
      localStorage.removeItem("loginAttempts");
      sessionStorage.setItem("loginSuccess", "true");
      setLoading(false);
      navigate("/home");
    }, 800);
  };

  const handleFailedAttempt = () => {
    const attempts = JSON.parse(localStorage.getItem("loginAttempts") || "0");
    const newAttempts = attempts + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutData = {
        timestamp: Date.now(),
      };
      localStorage.setItem("loginLockout", JSON.stringify(lockoutData));
      localStorage.setItem("loginAttempts", "0");
      setIsLocked(true);
      setLockoutTime(LOCKOUT_DURATION / 1000);
    } else {
      localStorage.setItem("loginAttempts", JSON.stringify(newAttempts));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-6">

      {/* Toast de cierre de sesión exitoso */}
      {showLogoutToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white border-2 border-green-200 shadow-md rounded-full px-4 py-3 transition-all max-w-[calc(100vw-2rem)]">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <span className="flex-1 text-sm text-gray-700">Sesión cerrada exitosamente</span>
          <button
            onClick={() => setShowLogoutToast(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Logo de la aplicación */}
        <div className="flex justify-center mb-8">
          <AppLogo size="md" variant="horizontal" showTagline={true} />
        </div>

      <Card className="w-full shadow-lg border-purple-100">
        <CardHeader className="space-y-4 pb-6">
          <CardTitle className="text-2xl text-center">Iniciar sesión</CardTitle>
          <CardDescription className="text-center text-base">
            Ingresa tus credenciales para continuar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-6">
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLocked && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cuenta bloqueada por múltiples intentos fallidos. 
                  Espera {lockoutTime} segundos para intentar de nuevo.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || isLocked}
                aria-label="Correo electrónico"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>

              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || isLocked}
                aria-label="Contraseña"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-6 px-6 pt-8 pb-6">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading || isLocked}
              size="lg"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>

            <p className="text-sm text-center text-gray-600">
              ¿No tienes cuenta?{" "}
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium">
                Regístrate aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Indicador de seguridad */}
      <SecurityIndicator variant="minimal" className="mt-4" />
      </div>
    </div>
  );
}