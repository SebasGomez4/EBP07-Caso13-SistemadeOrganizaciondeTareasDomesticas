import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LogOut, Users, CheckCircle2, ChevronRight, Shield, UserCog, User, Plus, Sparkles, X } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { NotificationBell } from "../components/NotificationBell";

const SESSION_TIMEOUT = 300000; // 5 minutos de inactividad

interface FamilyGroup {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}

interface UserGroup {
  id: string;
  name: string;
  role: "Administrador" | "Coadministrador" | "Colaborador";
}

export function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);

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
    const currentUserEmail = sessionData.user.email;
    setUserEmail(currentUserEmail);

    // Mostrar toast si viene de un login exitoso
    if (sessionStorage.getItem("loginSuccess") === "true") {
      sessionStorage.removeItem("loginSuccess");
      setShowLoginToast(true);
      setTimeout(() => setShowLoginToast(false), 3500);
    }

    // Escenario 4: Cargar grupos (simulando latencia < 2 segundos)
    setTimeout(() => {
      loadUserGroups(currentUserEmail);
      setLoading(false);
    }, 600);

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

  // Escenario 1 y 5: Cargar grupos del usuario con datos actuales
  const loadUserGroups = (email: string) => {
    const groups: FamilyGroup[] = JSON.parse(localStorage.getItem("familyGroups") || "[]");
    const members: Record<string, string[]> = JSON.parse(localStorage.getItem("groupMembers") || "{}");
    const roles: Record<string, Record<string, string>> = JSON.parse(localStorage.getItem("groupRoles") || "{}");

    const userGroupsList: UserGroup[] = [];

    groups.forEach((group) => {
      // Verificar si el usuario es creador o miembro del grupo
      const isCreator = group.createdBy === email;
      const groupMembers = members[group.id] || [];
      const isMember = groupMembers.includes(email);

      if (isCreator || isMember) {
        // Determinar el rol del usuario
        let userRole: "Administrador" | "Coadministrador" | "Colaborador" = "Colaborador";

        if (isCreator) {
          userRole = "Administrador";
        } else {
          const groupRoles = roles[group.id] || {};
          const roleInGroup = groupRoles[email] as "Administrador" | "Coadministrador" | "Colaborador" | undefined;
          userRole = roleInGroup || "Colaborador";
        }

        userGroupsList.push({
          id: group.id,
          name: group.name,
          role: userRole,
        });
      }
    });

    setUserGroups(userGroupsList);
  };

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

  // Escenario 3: Navegar al grupo seleccionado
  const handleGroupClick = (groupId: string) => {
    navigate(`/grupo/${groupId}`);
  };

  // Función helper para obtener ícono según el rol
  const getRoleIcon = (role: string) => {
    if (role === "Administrador") return <Shield className="h-4 w-4 text-purple-600" />;
    if (role === "Coadministrador") return <UserCog className="h-4 w-4 text-blue-600" />;
    return <User className="h-4 w-4 text-gray-600" />;
  };

  // Helper para obtener color de badge según rol
  const getRoleBadgeStyle = (role: string) => {
    if (role === "Administrador") return "bg-purple-100 text-purple-700 border-purple-200";
    if (role === "Coadministrador") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>

      {/* Toast de inicio de sesión exitoso */}
      {showLoginToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white border border-green-200 shadow-lg rounded-full px-5 py-3 transition-all max-w-[calc(100vw-2rem)] animate-in slide-in-from-top">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <span className="flex-1 text-sm font-medium text-gray-700">Inicio de sesión exitoso</span>
          <button
            onClick={() => setShowLoginToast(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {/* Header con glassmorphism */}
      <div className="relative bg-white/60 backdrop-blur-md border-b border-purple-100/50 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AppLogo size="sm" showTagline={false} />
            <div className="flex items-center gap-3 flex-wrap">
              {/* Campana de notificaciones (HU 4.1.1) */}
              <NotificationBell currentUserEmail={userEmail} />
              {/* Avatar: acceso rápido al perfil (Escenario 2 HU 1.3.1) */}
              <button
                onClick={() => navigate("/perfil")}
                title="Ver mi perfil"
                aria-label="Ver mi perfil"
                className="min-w-[2.75rem] min-h-[2.75rem] rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all ring-2 ring-purple-200 hover:ring-purple-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 focus-visible:ring-4 focus-visible:ring-purple-400/30"
              >
                <span className="text-white text-sm font-semibold select-none">
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
                className="flex items-center gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar sesión</span>
                <span className="sm:hidden">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero section moderna */}
        <div className="relative mb-10 sm:mb-14">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-purple-100 shadow-sm mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Bienvenido de vuelta</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Hola,{" "}
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {userName}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Organiza las tareas del hogar de forma inteligente y colabora con tu familia de manera eficiente
            </p>
          </div>
        </div>

        {/* Escenario 4: Estado de carga */}
        {loading ? (
          <div className="max-w-3xl mx-auto">
            <Card className="shadow-md border-purple-100/50 backdrop-blur-sm bg-white/80">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center text-center space-y-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 animate-pulse" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 opacity-20 animate-ping" />
                  </div>
                  <p className="text-gray-600 font-medium">Cargando tus grupos familiares...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Escenario 1: Lista de grupos */}
            {userGroups.length > 0 ? (
              <div className="space-y-8">
                {/* Encabezado de sección con acción */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Tus{" "}
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Grupos Familiares
                      </span>
                    </h2>
                    <p className="text-gray-600">
                      {userGroups.length === 1
                        ? "1 grupo disponible"
                        : `${userGroups.length} grupos disponibles`}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate("/crear-grupo")}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 w-full sm:w-auto h-11"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Crear nuevo grupo</span>
                  </Button>
                </div>

                {/* Grid moderno de grupos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {userGroups.map((group) => (
                    <Card
                      key={group.id}
                      className="group relative overflow-hidden border border-purple-100/50 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-xl hover:border-purple-200 transition-all duration-300 cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-purple-600 hover:-translate-y-1"
                      onClick={() => handleGroupClick(group.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ver detalles del grupo ${group.name}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleGroupClick(group.id);
                        }
                      }}
                    >
                      {/* Efecto de gradiente sutil en hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <CardContent className="relative p-6 space-y-4">
                        {/* Header del card con icono decorativo */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                              {/* Indicador decorativo */}
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 leading-tight">
                                {group.name}
                              </h3>
                              {/* Badge de rol */}
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors">
                                {getRoleIcon(group.role)}
                                <span className={getRoleBadgeStyle(group.role).split(" ").slice(1).join(" ")}>
                                  {group.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer del card con CTA */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-sm text-gray-500 font-medium">Ver detalles</span>
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-all">
                            <ChevronRight className="h-4 w-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Footer info */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500 inline-flex items-center gap-1.5 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-gray-200">
                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Tu sesión expirará después de 5 minutos de inactividad
                  </p>
                </div>
              </div>
            ) : (
              /* Escenario 2: Usuario sin grupos - Estado vacío moderno */
              <Card className="max-w-2xl mx-auto shadow-xl border-purple-100/50 backdrop-blur-sm bg-white/80 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-blue-50/50" />
                <CardContent className="relative pt-12 pb-12 px-6 sm:px-10">
                  <div className="text-center space-y-8">
                    {/* Icono decorativo grande */}
                    <div className="relative inline-block">
                      <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                        <Users className="h-12 w-12 text-white" />
                      </div>
                      {/* Anillos decorativos */}
                      <div className="absolute inset-0 w-24 h-24 mx-auto rounded-3xl border-4 border-purple-200 animate-ping opacity-20" />
                      <div className="absolute -inset-3 rounded-3xl border border-purple-100" />
                    </div>

                    <div className="space-y-3 max-w-md mx-auto">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Crea tu primer grupo
                      </h2>
                      <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                        Comienza a organizar las tareas del hogar y colabora con tu familia de forma eficiente
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <Button
                        onClick={() => navigate("/crear-grupo")}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 h-12 px-6 text-base font-medium"
                        size="lg"
                      >
                        <Plus className="h-5 w-5" />
                        Crear grupo familiar
                      </Button>
                    </div>

                    {/* Features mini */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                      {[
                        { icon: Users, text: "Colabora en familia" },
                        { icon: CheckCircle2, text: "Organiza tareas" },
                        { icon: Sparkles, text: "Mejora tu hogar" },
                      ].map((feature, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 p-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <feature.icon className="h-5 w-5 text-purple-600" />
                          </div>
                          <span className="text-xs font-medium text-gray-700">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
