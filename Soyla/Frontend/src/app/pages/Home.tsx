import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LogOut, Users, CheckCircle2 } from "lucide-react";
import { AppLogo } from "../components/AppLogo";

const SESSION_TIMEOUT = 300000; // 5 minutos de inactividad

export function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [showLoginToast, setShowLoginToast] = useState(false);

  useEffect(() => {
    // Verificar si hay una sesión activa
    const session = localStorage.getItem("currentSession");
    if (!session) {
      navigate("/");
      return;
    }

    const sessionData = JSON.parse(session);
    const now = Date.now();

    // Verificar si la sesión ha expirado
    if (now - sessionData.lastActivity >= SESSION_TIMEOUT) {
      localStorage.removeItem("currentSession");
      navigate("/");
      return;
    }

    setUserName(sessionData.user.fullName);

    // Mostrar toast si viene de un login exitoso
    if (sessionStorage.getItem("loginSuccess") === "true") {
      sessionStorage.removeItem("loginSuccess");
      setShowLoginToast(true);
      setTimeout(() => setShowLoginToast(false), 3500);
    }

    // Actualizar la última actividad
    const updateActivity = () => {
      const currentSession = localStorage.getItem("currentSession");
      if (currentSession) {
        const data = JSON.parse(currentSession);
        data.lastActivity = Date.now();
        localStorage.setItem("currentSession", JSON.stringify(data));
      }
    };

    // Monitorear actividad del usuario
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    // Verificar periódicamente si la sesión ha expirado
    const interval = setInterval(() => {
      const currentSession = localStorage.getItem("currentSession");
      if (!currentSession) {
        navigate("/");
        return;
      }

      const currentData = JSON.parse(currentSession);
      if (Date.now() - currentData.lastActivity >= SESSION_TIMEOUT) {
        localStorage.removeItem("currentSession");
        navigate("/");
      }
    }, 10000); // Verificar cada 10 segundos

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [navigate]);

  const handleLogout = () => {
    // Eliminar todos los datos de sesión y autenticación
    localStorage.removeItem("currentSession");
    localStorage.removeItem("loginAttempts");
    sessionStorage.removeItem("loginSuccess");

    // Marcar cierre de sesión exitoso
    sessionStorage.setItem("logoutSuccess", "true");

    // Redirigir a login
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">

      {/* Toast de inicio de sesión exitoso */}
      {showLoginToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white border border-green-200 shadow-md rounded-full px-4 py-2 transition-all">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-sm text-gray-700">Inicio de sesión exitoso</span>
        </div>
      )}

      {/* Header integrado */}
      <div className="bg-white/40 backdrop-blur-sm border-b border-purple-100/50">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <AppLogo size="sm" showTagline={false} />
          <div className="flex items-center gap-4">
            {/* Avatar: acceso rápido al perfil (Escenario 2 HU 1.3.1) */}
            <button
              onClick={() => navigate("/perfil")}
              title="Ver mi perfil"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center hover:opacity-90 transition-opacity ring-2 ring-purple-200 hover:ring-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <span className="text-white text-xs font-semibold select-none">
                {userName
                  .trim()
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w: string) => w[0].toUpperCase())
                  .join("")}
              </span>
            </button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 border-purple-200 hover:bg-purple-50"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto max-w-6xl px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-3">
            Hola, <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{userName}</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Gestiona las tareas domésticas de forma eficiente con tu familia
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-sm border-purple-100">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>

                <div>
                  <h2 className="text-xl mb-2">Crea tu primer grupo familiar</h2>
                  <p className="text-gray-600 text-sm">
                    Comienza a organizar las tareas del hogar con tu familia
                  </p>
                </div>

                <Button
                  onClick={() => navigate("/crear-grupo")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 mx-auto"
                  size="lg"
                >
                  <Users className="h-4 w-4" />
                  Crear grupo familiar
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-gray-500 text-center mt-6">
            Tu sesión expirará después de 5 minutos de inactividad
          </p>
        </div>
      </div>
    </div>
  );
}