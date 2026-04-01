import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { AppLogo } from "../components/AppLogo";

interface User {
  fullName: string;
  email: string;
  password: string;
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

    // Validación de campos vacíos
    if (!email.trim()) {
      setError("Por favor, ingresa tu correo electrónico");
      return;
    }

    if (!password.trim()) {
      setError("Por favor, ingresa tu contraseña");
      return;
    }

    setLoading(true);

    // Simular tiempo de respuesta del servidor
    setTimeout(() => {
      const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u: User) => u.email === email);

      // Usuario no registrado
      if (!user) {
        handleFailedAttempt();
        setError("No existe una cuenta con este correo electrónico");
        setLoading(false);
        return;
      }

      // Contraseña incorrecta
      if (user.password !== password) {
        handleFailedAttempt();
        setError("Contraseña incorrecta");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">

      {/* Toast de cierre de sesión exitoso */}
      {showLogoutToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white border border-green-200 shadow-md rounded-full px-4 py-2 transition-all">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-sm text-gray-700">Sesión cerrada exitosamente</span>
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Logo de la aplicación con mayor protagonismo */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3 py-2 leading-tight">
            Soyla
          </h1>
          <p className="text-gray-600 text-base">
            Sistema de gestión de tareas domésticas
          </p>
        </div>

      <Card className="w-full shadow-lg border-purple-100">
        <CardHeader className="space-y-3 pb-6">
          <CardTitle className="text-2xl text-center">Iniciar sesión</CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para continuar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-6">
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

            <div className="space-y-2.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || isLocked}
                className="h-11"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || isLocked}
                className="h-11"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-5 px-6 pt-8 pb-6">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading || isLocked}
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
      </div>
    </div>
  );
}