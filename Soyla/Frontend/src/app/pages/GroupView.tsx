import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Home, Users, LogOut, UserPlus, Copy, CheckCheck, Clock, Link2 } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { CreateTaskForm } from "../components/CreateTaskForm";
import { MembersList } from "../components/MembersList";
import { TasksList } from "../components/TasksList";

const SESSION_TIMEOUT = 300000;
const INVITE_TTL = 72 * 60 * 60 * 1000; // 72 horas en ms

interface FamilyGroup {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}

interface InviteRecord {
  code: string;
  groupId: string;
  groupName: string;
  createdAt: number;
  expiresAt: number;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function getActiveInvite(groupId: string): InviteRecord | null {
  const invites: InviteRecord[] = JSON.parse(
    localStorage.getItem("familyInvites") || "[]"
  );
  return (
    invites.find(
      (i) => i.groupId === groupId && Date.now() < i.expiresAt
    ) ?? null
  );
}

export function GroupView() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<"Administrador" | "Coadministrador" | "Colaborador">("Colaborador");

  // ── Invite state ──
  const [inviteLink, setInviteLink] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState<number | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);

  // ── Members state ──
  const [memberCount, setMemberCount] = useState(0);

  // ── Tasks state ──
  const [tasksRefreshTrigger, setTasksRefreshTrigger] = useState(0);

  useEffect(() => {
    const session = localStorage.getItem("currentSession");
    if (!session) { navigate("/"); return; }

    const sessionData = JSON.parse(session);
    const now = Date.now();

    if (now - sessionData.lastActivity >= SESSION_TIMEOUT) {
      localStorage.removeItem("currentSession");
      navigate("/");
      return;
    }

    setUserName(sessionData.user.fullName);
    const currentUserEmail = sessionData.user.email;
    setUserEmail(currentUserEmail);

    const groups: FamilyGroup[] = JSON.parse(localStorage.getItem("familyGroups") || "[]");
    const foundGroup = groups.find((g) => g.id === groupId);
    if (!foundGroup) { navigate("/home"); return; }

    setGroup(foundGroup);
    localStorage.removeItem("lastCreatedGroup");

    // Contar miembros actuales
    const members: Record<string, string[]> = JSON.parse(
      localStorage.getItem("groupMembers") || "{}"
    );
    const list = members[foundGroup.id] || [];
    // Incluir al creador si no está en la lista
    const creatorEmail = foundGroup.createdBy;
    const allMembers = list.includes(creatorEmail) ? list : [creatorEmail, ...list];
    setMemberCount(allMembers.length);

    // Asegurar que el creador esté en la lista de miembros
    if (!list.includes(creatorEmail)) {
      const updatedMembers = { ...members };
      updatedMembers[foundGroup.id] = [creatorEmail, ...list];
      localStorage.setItem("groupMembers", JSON.stringify(updatedMembers));
    }

    // Obtener o inicializar roles
    const groupRoles: Record<string, Record<string, string>> = JSON.parse(
      localStorage.getItem("groupRoles") || "{}"
    );
    if (!groupRoles[foundGroup.id]) {
      groupRoles[foundGroup.id] = {};
    }

    // El creador siempre es Administrador
    if (!groupRoles[foundGroup.id][creatorEmail]) {
      groupRoles[foundGroup.id][creatorEmail] = "Administrador";
      localStorage.setItem("groupRoles", JSON.stringify(groupRoles));
    }

    // Establecer el rol del usuario actual
    const currentRole = groupRoles[foundGroup.id][currentUserEmail] || "Colaborador";
    setUserRole(currentRole as "Administrador" | "Coadministrador" | "Colaborador");

    // Comprobar si ya hay un invite activo para este grupo
    const existing = getActiveInvite(foundGroup.id);
    if (existing) {
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/unirse/${existing.code}`);
      setInviteExpiresAt(existing.expiresAt);
    }
  }, [navigate, groupId]);

  const handleGoHome = () => navigate("/home");
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

  // ── Generar / mostrar enlace de invitación ──
  const handleInvite = () => {
    if (showInvite) {
      setShowInvite(false);
      return;
    }

    setGeneratingInvite(true);

    setTimeout(() => {
      if (!group) return;

      // Reusar invite activo si existe
      const existing = getActiveInvite(group.id);
      if (existing) {
        const baseUrl = window.location.origin;
        setInviteLink(`${baseUrl}/unirse/${existing.code}`);
        setInviteExpiresAt(existing.expiresAt);
        setShowInvite(true);
        setGeneratingInvite(false);
        return;
      }

      // Generar nuevo código (Escenario 1 / 5)
      const code = generateInviteCode();
      const now = Date.now();
      const newInvite: InviteRecord = {
        code,
        groupId: group.id,
        groupName: group.name,
        createdAt: now,
        expiresAt: now + INVITE_TTL,
      };

      const invites: InviteRecord[] = JSON.parse(
        localStorage.getItem("familyInvites") || "[]"
      );
      invites.push(newInvite);
      localStorage.setItem("familyInvites", JSON.stringify(invites));

      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/unirse/${code}`);
      setInviteExpiresAt(newInvite.expiresAt);
      setShowInvite(true);
      setGeneratingInvite(false);
    }, 600);
  };

  // ── Manejar creación de tarea ──
  const handleTaskCreated = () => {
    setTasksRefreshTrigger((prev) => prev + 1);
  };

  // ── Copiar enlace ──
  const handleCopy = () => {
    // Método legacy con textarea temporal
    const fallbackCopy = (text: string): boolean => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
      } catch (err) {
        document.body.removeChild(textarea);
        return false;
      }
    };

    // Intentar el método moderno primero, con fallback automático
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => {
          // Si falla el método moderno, usar fallback
          const success = fallbackCopy(inviteLink);
          if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }
        });
    } else {
      // Usar fallback directamente si no hay API moderna
      const success = fallbackCopy(inviteLink);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  // ── Helpers ──
  const hoursLeft = inviteExpiresAt
    ? Math.max(0, Math.ceil((inviteExpiresAt - Date.now()) / 3600000))
    : 0;

  if (!group) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
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
            <button
              onClick={() => navigate("/perfil")}
              title="Ver mi perfil"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center hover:opacity-90 transition-opacity ring-2 ring-purple-200 hover:ring-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <span className="text-white text-xs font-semibold select-none">
                {userName.trim().split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("")}
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
                Creado el{" "}
                {new Date(group.createdAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* ── Tarjeta: Gestión de miembros (HU 2.1.2) ── */}
          <Card className="shadow-sm border-purple-100">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Gestión de miembros
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {memberCount === 1
                      ? "1 miembro en el grupo"
                      : `${memberCount} miembros en el grupo`}
                  </CardDescription>
                </div>
                {/* Botón principal: Invitar a la familia */}
                <Button
                  onClick={handleInvite}
                  disabled={generatingInvite}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 h-10"
                >
                  {generatingInvite ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Invitar a la familia
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            {/* Panel de enlace de invitación */}
            {showInvite && (
              <CardContent className="pt-0 pb-6">
                <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-5 space-y-4">
                  {/* Encabezado del panel */}
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-purple-500 shrink-0" />
                    <p className="text-sm text-gray-700">
                      Comparte este enlace con los miembros que deseas invitar:
                    </p>
                  </div>

                  {/* Enlace + botón copiar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-purple-100 rounded-lg px-3 py-2.5 overflow-hidden">
                      <p className="text-xs text-gray-600 truncate select-all font-mono">
                        {inviteLink}
                      </p>
                    </div>
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className={`h-10 shrink-0 flex items-center gap-1.5 transition-colors ${
                        copied
                          ? "border-green-300 text-green-600 bg-green-50 hover:bg-green-50"
                          : "border-purple-200 hover:bg-purple-50"
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckCheck className="h-4 w-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Vigencia */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Enlace válido por{" "}
                      <span className="text-purple-500 font-medium">
                        {hoursLeft} hora{hoursLeft !== 1 ? "s" : ""}
                      </span>{" "}
                      más · Vigencia máxima de 72 horas
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* ── Lista de miembros (HU 2.3.3) ── */}
          <MembersList
            groupId={groupId || ""}
            currentUserEmail={userEmail}
            currentUserRole={userRole}
          />

          {/* ── Lista de tareas (HU 4.2.1) ── */}
          <TasksList groupId={groupId || ""} refreshTrigger={tasksRefreshTrigger} />

          {/* ── Tarjeta: Crear tareas ── */}
          <Card className="shadow-sm border-purple-100">
            <CardHeader>
              <CardTitle className="text-xl">Crear nueva tarea</CardTitle>
              <CardDescription>
                Organiza las responsabilidades del hogar entre los miembros del grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTaskForm groupId={groupId || ""} onTaskCreated={handleTaskCreated} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}