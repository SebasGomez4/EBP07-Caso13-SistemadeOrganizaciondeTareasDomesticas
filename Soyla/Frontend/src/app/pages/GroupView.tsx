import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Home, Users, LogOut } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { CreateTaskForm } from "../components/CreateTaskForm";

const SESSION_TIMEOUT = 300000; // 5 minutos de inactividad

interface FamilyGroup {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}

export function GroupView() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState<FamilyGroup | null>(null);

  useEffect(() => {
    // Verificar autenticación
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

    // Buscar el grupo por ID
    const groups: FamilyGroup[] = JSON.parse(localStorage.getItem("familyGroups") || "[]");
    const foundGroup = groups.find((g) => g.id === groupId);

    if (!foundGroup) {
      navigate("/home");
      return;
    }

    setGroup(foundGroup);

    // Limpiar el grupo temporal si existe
    localStorage.removeItem("lastCreatedGroup");
  }, [navigate, groupId]);

  const handleGoHome = () => {
    navigate("/home");
  };

  const handleLogout = () => {
    localStorage.removeItem("currentSession");
    sessionStorage.setItem("logoutSuccess", "true");
    navigate("/");
  };

  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header integrado */}
      <div className="bg-white/40 backdrop-blur-sm border-b border-purple-100/50">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <AppLogo size="sm" showTagline={false} />
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="flex items-center gap-2 border-purple-200 hover:bg-purple-50"
            >
              <Home className="h-4 w-4" />
              Inicio
            </Button>
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
      <div className="container mx-auto max-w-6xl px-6 py-8">
        {/* Título del grupo */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent py-1 leading-tight">
                {group.name}
              </h1>
              <p className="text-sm text-gray-500">Grupo familiar</p>
              <p className="text-xs text-gray-400 mt-1">
                Creado el {new Date(group.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Sección de gestión de tareas */}
        <div className="space-y-6">
          <Card className="shadow-sm border-purple-100">
            <CardHeader>
              <CardTitle className="text-xl">Tareas del hogar</CardTitle>
              <CardDescription>
                Crea y organiza las tareas del hogar para tu grupo familiar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTaskForm groupId={groupId || ""} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}