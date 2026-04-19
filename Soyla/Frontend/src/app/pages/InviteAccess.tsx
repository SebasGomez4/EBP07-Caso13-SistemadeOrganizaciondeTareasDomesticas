import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { AppLogo } from "../components/AppLogo";
import {
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  LogIn,
  RefreshCw,
  Home,
} from "lucide-react";

const SESSION_TIMEOUT = 300000;

interface InviteRecord {
  code: string;
  groupId: string;
  groupName: string;
  createdAt: number;
  expiresAt: number;
}

interface FamilyGroup {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}

type InviteState =
  | "loading"
  | "unauthenticated"
  | "success"
  | "already_member"
  | "invalid"
  | "expired";

export function InviteAccess() {
  const navigate = useNavigate();
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [state, setState] = useState<InviteState>("loading");
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    // Escenario 6: completarse en < 2 segundos — simulamos ~800ms de validación
    const timer = setTimeout(() => {
      processInvite();
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  function processInvite() {
    if (!inviteCode) {
      setState("invalid");
      return;
    }

    // Recuperar todos los invites registrados
    const invites: InviteRecord[] = JSON.parse(
      localStorage.getItem("familyInvites") || "[]"
    );
    const invite = invites.find((i) => i.code === inviteCode);

    // Escenario 4: enlace inválido
    if (!invite) {
      setState("invalid");
      return;
    }

    // Escenario 5 / 4: enlace expirado (vigencia 72 horas)
    if (Date.now() > invite.expiresAt) {
      setState("expired");
      return;
    }

    // Verificar si el grupo sigue existiendo
    const groups: FamilyGroup[] = JSON.parse(
      localStorage.getItem("familyGroups") || "[]"
    );
    const group = groups.find((g) => g.id === invite.groupId);
    if (!group) {
      setState("invalid");
      return;
    }

    setGroupName(invite.groupName || group.name);
    setGroupId(invite.groupId);

    // Verificar sesión activa
    const session = localStorage.getItem("currentSession");
    if (!session) {
      // Guardar el código pendiente para retomar tras el login
      localStorage.setItem("pendingInviteCode", inviteCode);
      setState("unauthenticated");
      return;
    }

    const sessionData = JSON.parse(session);
    const now = Date.now();

    if (now - sessionData.lastActivity >= SESSION_TIMEOUT) {
      localStorage.removeItem("currentSession");
      localStorage.setItem("pendingInviteCode", inviteCode);
      setState("unauthenticated");
      return;
    }

    const userEmail: string = sessionData.user.email;

    // Escenario 3: usuario ya es miembro
    const members: Record<string, string[]> = JSON.parse(
      localStorage.getItem("groupMembers") || "{}"
    );
    const groupMembers = members[invite.groupId] || [];

    if (groupMembers.includes(userEmail)) {
      setState("already_member");
      return;
    }

    // Escenario 2: agregar usuario al grupo
    const updatedMembers = { ...members };
    updatedMembers[invite.groupId] = [...groupMembers, userEmail];
    localStorage.setItem("groupMembers", JSON.stringify(updatedMembers));

    // Asignar rol inicial de "Colaborador" al nuevo miembro
    const groupRoles: Record<string, Record<string, string>> = JSON.parse(
      localStorage.getItem("groupRoles") || "{}"
    );
    if (!groupRoles[invite.groupId]) {
      groupRoles[invite.groupId] = {};
    }
    if (!groupRoles[invite.groupId][userEmail]) {
      groupRoles[invite.groupId][userEmail] = "Colaborador";
      localStorage.setItem("groupRoles", JSON.stringify(groupRoles));
    }

    // Actualizar actividad de sesión
    sessionData.lastActivity = Date.now();
    localStorage.setItem("currentSession", JSON.stringify(sessionData));

    // Limpiar pending invite si existía
    localStorage.removeItem("pendingInviteCode");

    setState("success");
  }

  // ── Solicitar nuevo enlace ─────────────────────────────────────────────────
  // Redirige al grupo (si el usuario tiene acceso) para que el administrador
  // genere uno nuevo. Como no se puede saber quién es el admin desde aquí,
  // se muestra un mensaje orientativo.
  const handleRequestNew = () => {
    navigate("/home");
  };

  const handleGoToLogin = () => {
    navigate("/");
  };

  const handleGoHome = () => {
    navigate("/home");
  };

  const handleGoToGroup = () => {
    navigate(`/grupo/${groupId}`);
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Header mínimo */}
      <div className="bg-white/40 backdrop-blur-sm border-b border-purple-100/50">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <AppLogo size="sm" showTagline={false} />
          {state !== "loading" && state !== "unauthenticated" && (
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="flex items-center gap-2 border-purple-200 hover:bg-purple-50"
            >
              <Home className="h-4 w-4" />
              Inicio
            </Button>
          )}
        </div>
      </div>

      {/* Contenido centrado */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* ── Estado: Cargando / Validando ── */}
          {state === "loading" && (
            <Card className="shadow-sm border-purple-100">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl text-gray-800">Validando invitación...</h2>
                    <p className="text-gray-500 text-sm">
                      Estamos procesando tu enlace de invitación.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Estado: No autenticado ── */}
          {state === "unauthenticated" && (
            <Card className="shadow-sm border-purple-100">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <LogIn className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl text-gray-800">Inicia sesión para continuar</h2>
                    <p className="text-gray-500 text-sm">
                      Necesitas iniciar sesión para unirte al grupo familiar.
                      El enlace seguirá siendo válido.
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    <Button
                      onClick={handleGoToLogin}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      Iniciar sesión
                    </Button>
                    <p className="text-xs text-gray-400 text-center">
                      Después de iniciar sesión, vuelve a este enlace para unirte al grupo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Estado: Éxito (Escenario 2) ── */}
          {state === "success" && (
            <Card className="shadow-sm border-green-100">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl text-gray-800">¡Te has unido al grupo!</h2>
                    <p className="text-gray-500 text-sm">
                      Ahora eres miembro de{" "}
                      <span className="text-purple-600 font-medium">{groupName}</span>.
                      Puedes empezar a gestionar las tareas del hogar junto a tu familia.
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    <Button
                      onClick={handleGoToGroup}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Ir al grupo familiar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGoHome}
                      className="w-full h-11 border-purple-200 hover:bg-purple-50"
                    >
                      Ir al inicio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Estado: Ya es miembro (Escenario 3) ── */}
          {state === "already_member" && (
            <Card className="shadow-sm border-blue-100">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Info className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl text-gray-800">Ya perteneces a este grupo</h2>
                    <p className="text-gray-500 text-sm">
                      Ya eres miembro de{" "}
                      <span className="text-purple-600 font-medium">{groupName}</span>.
                      No es necesario unirte de nuevo.
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    <Button
                      onClick={handleGoToGroup}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Ir al grupo familiar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGoHome}
                      className="w-full h-11 border-purple-200 hover:bg-purple-50"
                    >
                      Ir al inicio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Estado: Enlace inválido (Escenario 4) ── */}
          {state === "invalid" && (
            <Card className="shadow-sm border-red-100">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl text-red-600">Enlace no válido</h2>
                    <p className="text-gray-500 text-sm">
                      El enlace de invitación que usaste no es válido.
                      Puede que haya sido eliminado o nunca existió.
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    <Button
                      onClick={handleRequestNew}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Solicitar nuevo enlace
                    </Button>
                    <p className="text-xs text-gray-400 text-center">
                      Pide al administrador del grupo que genere un nuevo enlace de invitación.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Estado: Enlace expirado (Escenario 4 / 5) ── */}
          {state === "expired" && (
            <Card className="shadow-sm border-orange-100">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-orange-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl text-orange-600">Enlace expirado</h2>
                    <p className="text-gray-500 text-sm">
                      Este enlace de invitación ha superado su vigencia de 72 horas
                      y ya no está activo.
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    <Button
                      onClick={handleRequestNew}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Solicitar nuevo enlace
                    </Button>
                    <p className="text-xs text-gray-400 text-center">
                      Pide al administrador del grupo que genere un nuevo enlace de invitación.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
