import { useState, type FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { ApiError, loginUser } from "../lib/api";
import { getActiveSession, saveSession } from "../lib/session";

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30000;

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showLogoutToast, setShowLogoutToast] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("logoutSuccess") === "true") {
      sessionStorage.removeItem("logoutSuccess");
      setShowLogoutToast(true);
      window.setTimeout(() => setShowLogoutToast(false), 3500);
    }

    if (getActiveSession()) {
      navigate("/home");
    }
  }, [navigate]);

  useEffect(() => {
    const lockout = localStorage.getItem("loginLockout");
    if (!lockout) {
      return;
    }

    const lockoutData = JSON.parse(lockout) as { timestamp: number };
    const timeRemaining = LOCKOUT_DURATION - (Date.now() - lockoutData.timestamp);

    if (timeRemaining <= 0) {
      localStorage.removeItem("loginLockout");
      return;
    }

    setIsLocked(true);
    setLockoutTime(Math.ceil(timeRemaining / 1000));

    const interval = window.setInterval(() => {
      const newTimeRemaining = LOCKOUT_DURATION - (Date.now() - lockoutData.timestamp);
      if (newTimeRemaining <= 0) {
        setIsLocked(false);
        setLockoutTime(0);
        localStorage.removeItem("loginLockout");
        window.clearInterval(interval);
      } else {
        setLockoutTime(Math.ceil(newTimeRemaining / 1000));
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLocked) {
      setError(`Cuenta bloqueada temporalmente. Intenta de nuevo en ${lockoutTime} segundos.`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const user = await loginUser({
        email: email.trim(),
        password,
      });

      saveSession(user);
      localStorage.removeItem("loginAttempts");
      sessionStorage.setItem("loginSuccess", "true");

      const pendingInviteCode = localStorage.getItem("pendingInviteCode");
      navigate(pendingInviteCode ? `/unirse/${pendingInviteCode}` : "/home");
    } catch (caughtError) {
      handleFailedAttempt();
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "No fue posible iniciar sesion."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFailedAttempt = () => {
    const attempts = Number(localStorage.getItem("loginAttempts") || "0");
    const newAttempts = attempts + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
      localStorage.setItem("loginLockout", JSON.stringify({ timestamp: Date.now() }));
      localStorage.setItem("loginAttempts", "0");
      setIsLocked(true);
      setLockoutTime(LOCKOUT_DURATION / 1000);
    } else {
      localStorage.setItem("loginAttempts", JSON.stringify(newAttempts));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      {showLogoutToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white border border-green-200 shadow-md rounded-full px-4 py-2 transition-all">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-sm text-gray-700">Sesion cerrada exitosamente</span>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <AppLogo size="md" variant="horizontal" showTagline={true} />
        </div>

        <Card className="w-full shadow-lg border-purple-100">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-2xl text-center">Iniciar sesion</CardTitle>
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
                    Cuenta bloqueada por multiples intentos fallidos. Espera {lockoutTime} segundos para intentar de nuevo.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2.5">
                <Label htmlFor="email">Correo electronico</Label>
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
                <Label htmlFor="password">Contrasena</Label>
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
                No tienes cuenta?{" "}
                <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium">
                  Registrate aqui
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
