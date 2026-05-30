import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LogOut, Users, CheckCircle2, ArrowRight, Plus, Loader2 } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { type FamilyGroup, listGroups } from "../lib/api";
import { clearSession, getActiveSession, markLogoutSuccess, touchSession } from "../lib/session";

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
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getActiveSession();
    if (!session) {
      navigate("/");
      return;
    }

    setUserName(session.user.fullName);

    if (sessionStorage.getItem("loginSuccess") === "true") {
      sessionStorage.removeItem("loginSuccess");
      setShowLoginToast(true);
      window.setTimeout(() => setShowLoginToast(false), 3500);
    }

    const loadGroups = async () => {
      try {
        const loadedGroups = await listGroups(session.user.email);
        setGroups(loadedGroups);
      } finally {
        setLoadingGroups(false);
      }
    };

    void loadGroups();

    const updateActivity = () => {
      touchSession();
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((eventName) => window.addEventListener(eventName, updateActivity));

    const interval = window.setInterval(() => {
      if (!getActiveSession()) {
        navigate("/");
      }
    }, 10000);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, updateActivity));
      window.clearInterval(interval);
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
    clearSession();
    markLogoutSuccess();
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {showLoginToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white border border-green-200 shadow-md rounded-full px-4 py-2 transition-all">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-sm text-gray-700">Inicio de sesion exitoso</span>
        </div>
      )}

      <div className="bg-white/40 backdrop-blur-sm border-b border-purple-100/50">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <AppLogo size="sm" showTagline={false} />
          <div className="flex items-center gap-4">
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
                  .map((word) => word[0].toUpperCase())
                  .join("")}
              </span>
            </button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 border-purple-200 hover:bg-purple-50"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-3">
            Hola, <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{userName}</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Gestiona las tareas domesticas de forma eficiente con tu familia
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-sm border-purple-100">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>

                <div>
                  <h2 className="text-xl mb-2">Crea un nuevo grupo familiar</h2>
                  <p className="text-gray-600 text-sm">
                    Invita a tu familia y organiza responsabilidades desde una API real
                  </p>
                </div>

                <Button
                  onClick={() => navigate("/crear-grupo")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 mx-auto"
                  size="lg"
                >
                  <Plus className="h-4 w-4" />
                  Crear grupo familiar
                </Button>
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

          <Card className="shadow-sm border-purple-100">
            <CardHeader>
              <CardTitle className="text-xl">Mis grupos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingGroups ? (
                <div className="flex items-center justify-center py-8 gap-3 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Cargando grupos...
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aun no perteneces a ningun grupo. Crea uno o acepta una invitacion.
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-purple-100 bg-white"
                    >
                      <div>
                        <p className="text-lg text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-500">
                          {group.memberCount} miembro{group.memberCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate(`/grupo/${group.id}`)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center gap-2"
                      >
                        Entrar
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
