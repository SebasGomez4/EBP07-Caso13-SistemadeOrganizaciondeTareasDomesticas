import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Home, Users, LogOut, UserPlus, Copy, CheckCheck, Clock, Link2, UserMinus, AlertTriangle, Trash2, MoreVertical } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { NotificationBell } from "../components/NotificationBell";
import { CreateTaskForm } from "../components/CreateTaskForm";
import { MembersList } from "../components/MembersList";
import { TasksList } from "../components/TasksList";
import { WeeklyRankingForm } from "../components/WeeklyRankingForm";
import { WeeklyRankingView } from "../components/WeeklyRankingView";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const SESSION_TIMEOUT = 300000;
const INVITE_TTL = 72 * 60 * 60 * 1000;

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

  // ── Leave group state ──
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isOnlyAdmin, setIsOnlyAdmin] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);

  // ── Delete group state ──
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

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

    const members: Record<string, string[]> = JSON.parse(
      localStorage.getItem("groupMembers") || "{}"
    );
    const list = members[foundGroup.id] || [];
    const creatorEmail = foundGroup.createdBy;
    const allMembers = list.includes(creatorEmail) ? list : [creatorEmail, ...list];
    setMemberCount(allMembers.length);

    if (!list.includes(creatorEmail)) {
      const updatedMembers = { ...members };
      updatedMembers[foundGroup.id] = [creatorEmail, ...list];
      localStorage.setItem("groupMembers", JSON.stringify(updatedMembers));
    }

    const groupRoles: Record<string, Record<string, string>> = JSON.parse(
      localStorage.getItem("groupRoles") || "{}"
    );
    if (!groupRoles[foundGroup.id]) {
      groupRoles[foundGroup.id] = {};
    }

    if (!groupRoles[foundGroup.id][creatorEmail]) {
      groupRoles[foundGroup.id][creatorEmail] = "Administrador";
      localStorage.setItem("groupRoles", JSON.stringify(groupRoles));
    }

    const currentRole = groupRoles[foundGroup.id][currentUserEmail] || "Colaborador";
    setUserRole(currentRole as "Administrador" | "Coadministrador" | "Colaborador");

    const existing = getActiveInvite(foundGroup.id);
    if (existing) {
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/unirse/${existing.code}`);
      setInviteExpiresAt(existing.expiresAt);
    }
  }, [navigate, groupId]);

  const handleGoHome = () => navigate("/home");
  const handleLogout = () => {
    localStorage.removeItem("currentSession");
    localStorage.removeItem("loginAttempts");
    sessionStorage.removeItem("loginSuccess");
    sessionStorage.setItem("logoutSuccess", "true");
    navigate("/");
  };

  const handleInvite = () => {
    if (showInvite) {
      setShowInvite(false);
      return;
    }

    setGeneratingInvite(true);

    setTimeout(() => {
      if (!group) return;

      const existing = getActiveInvite(group.id);
      if (existing) {
        const baseUrl = window.location.origin;
        setInviteLink(`${baseUrl}/unirse/${existing.code}`);
        setInviteExpiresAt(existing.expiresAt);
        setShowInvite(true);
        setGeneratingInvite(false);
        return;
      }

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

  const handleTaskCreated = () => {
    setTasksRefreshTrigger((prev) => prev + 1);
  };

  const handleCopy = () => {
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

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => {
          const success = fallbackCopy(inviteLink);
          if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }
        });
    } else {
      const success = fallbackCopy(inviteLink);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const handleDeleteGroupClick = () => {
    if (userRole !== "Administrador") return;
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!group || userRole !== "Administrador") return;

    setDeletingGroup(true);

    setTimeout(() => {
      const groups: FamilyGroup[] = JSON.parse(
        localStorage.getItem("familyGroups") || "[]"
      );
      const updatedGroups = groups.filter((g) => g.id !== group.id);
      localStorage.setItem("familyGroups", JSON.stringify(updatedGroups));

      const members: Record<string, string[]> = JSON.parse(
        localStorage.getItem("groupMembers") || "{}"
      );
      delete members[group.id];
      localStorage.setItem("groupMembers", JSON.stringify(members));

      const groupRoles: Record<string, Record<string, string>> = JSON.parse(
        localStorage.getItem("groupRoles") || "{}"
      );
      delete groupRoles[group.id];
      localStorage.setItem("groupRoles", JSON.stringify(groupRoles));

      const tasks: Record<string, any[]> = JSON.parse(
        localStorage.getItem("groupTasks") || "{}"
      );
      delete tasks[group.id];
      localStorage.setItem("groupTasks", JSON.stringify(tasks));

      const invites: InviteRecord[] = JSON.parse(
        localStorage.getItem("familyInvites") || "[]"
      );
      const updatedInvites = invites.filter((i) => i.groupId !== group.id);
      localStorage.setItem("familyInvites", JSON.stringify(updatedInvites));

      setDeletingGroup(false);
      setShowDeleteDialog(false);
      navigate("/home");
    }, 1200);
  };

  const checkIfOnlyAdmin = (): boolean => {
    if (!group) return false;

    const groupRoles: Record<string, Record<string, string>> = JSON.parse(
      localStorage.getItem("groupRoles") || "{}"
    );
    const rolesInGroup = groupRoles[group.id] || {};

    const adminCount = Object.values(rolesInGroup).filter(
      (role) => role === "Administrador"
    ).length;

    return rolesInGroup[userEmail] === "Administrador" && adminCount === 1;
  };

  const handleLeaveGroupClick = () => {
    const onlyAdmin = checkIfOnlyAdmin();
    setIsOnlyAdmin(onlyAdmin);
    setShowLeaveDialog(true);
  };

  const handleConfirmLeave = () => {
    if (isOnlyAdmin || !group) return;

    setLeavingGroup(true);

    setTimeout(() => {
      const members: Record<string, string[]> = JSON.parse(
        localStorage.getItem("groupMembers") || "{}"
      );
      const groupMembers = members[group.id] || [];

      const updatedMembers = groupMembers.filter((email) => email !== userEmail);
      members[group.id] = updatedMembers;
      localStorage.setItem("groupMembers", JSON.stringify(members));

      const groupRoles: Record<string, Record<string, string>> = JSON.parse(
        localStorage.getItem("groupRoles") || "{}"
      );
      if (groupRoles[group.id] && groupRoles[group.id][userEmail]) {
        delete groupRoles[group.id][userEmail];
        localStorage.setItem("groupRoles", JSON.stringify(groupRoles));
      }

      setLeavingGroup(false);
      setShowLeaveDialog(false);
      navigate("/home");
    }, 800);
  };

  const hoursLeft = inviteExpiresAt
    ? Math.max(0, Math.ceil((inviteExpiresAt - Date.now()) / 3600000))
    : 0;

  if (!group) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-indigo-50/30">
      {/* Header compacto */}
      <div className="bg-white/60 backdrop-blur-md border-b border-purple-100/50 sticky top-0 z-40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <AppLogo size="sm" showTagline={false} />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoHome}
              className="text-gray-600 hover:text-gray-900 hover:bg-purple-50/50"
            >
              <Home className="h-4 w-4 mr-1.5" />
              Inicio
            </Button>
            <NotificationBell currentUserEmail={userEmail} />
            <button
              onClick={() => navigate("/perfil")}
              title={userName}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center hover:shadow-md transition-shadow ring-2 ring-purple-200/50 hover:ring-purple-300"
            >
              <span className="text-white text-xs font-semibold select-none">
                {userName.trim().split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("")}
              </span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLeaveGroupClick}>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Abandonar grupo
                </DropdownMenuItem>
                {userRole === "Administrador" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDeleteGroupClick} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar grupo
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Hero Section del Grupo */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-4 ring-white/30">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {group.name}
                </h1>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/50" />
                  <span>
                    {new Date(group.createdAt).toLocaleDateString("es-ES", {
                      month: "long",
                      year: "numeric",
                    }).replace(/^\w/, (c) => c.toUpperCase())}
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleInvite}
              disabled={generatingInvite}
              size="lg"
              className="bg-white text-purple-700 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all"
            >
              {generatingInvite ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invitar miembro
                </>
              )}
            </Button>
          </div>

          {/* Panel de invitación inline */}
          {showInvite && (
            <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-4 w-4 text-white/90" />
                <p className="text-sm text-white/90 font-medium">
                  Enlace de invitación
                </p>
                <span className="ml-auto text-xs text-white/60 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {hoursLeft}h restantes
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-white font-mono truncate select-all">
                    {inviteLink}
                  </p>
                </div>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className={`shrink-0 ${
                    copied
                      ? "border-green-300 text-green-700 bg-green-50"
                      : "border-white/30 text-white bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCheck className="h-4 w-4 mr-1.5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal con grid moderno */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal: Tareas y Ranking */}
          <div className="lg:col-span-2 space-y-6">
            <TasksList
              groupId={groupId || ""}
              refreshTrigger={tasksRefreshTrigger}
              currentUserRole={userRole}
              createTaskButton={
                userRole !== "Colaborador"
                  ? <CreateTaskForm groupId={groupId || ""} onTaskCreated={handleTaskCreated} />
                  : undefined
              }
            />
          </div>

          {/* Columna lateral: Miembros y Ranking */}
          <div className="space-y-6">
            <MembersList
              groupId={groupId || ""}
              currentUserEmail={userEmail}
              currentUserRole={userRole}
            />

            <WeeklyRankingView
              groupId={groupId || ""}
              currentUserEmail={userEmail}
              refreshTrigger={tasksRefreshTrigger}
            />

            <WeeklyRankingForm groupId={groupId || ""} currentUserRole={userRole} />
          </div>
        </div>
      </div>

      {/* Modals sin cambios */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {isOnlyAdmin ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  No puedes abandonar el grupo
                </>
              ) : (
                <>
                  <UserMinus className="h-5 w-5 text-gray-700" />
                  ¿Deseas abandonar este grupo?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isOnlyAdmin ? (
                <div className="space-y-3 pt-2">
                  <Alert variant="default" className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-900">
                      Debes transferir la administración antes de abandonar el grupo
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-gray-600">
                    Eres el único administrador de este grupo. Asigna el rol de administrador
                    a otro miembro antes de poder salir.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <p className="text-sm text-gray-600">
                    Al abandonar el grupo <span className="font-medium text-gray-900">"{group?.name}"</span>,
                    perderás acceso a todas sus tareas y actividades.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isOnlyAdmin ? (
              <AlertDialogCancel>Entendido</AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel disabled={leavingGroup}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmLeave}
                  disabled={leavingGroup}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {leavingGroup ? "Abandonando..." : "Sí, abandonar grupo"}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              ¿Eliminar grupo "{group?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 pt-2">
                <Alert variant="default" className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    <span className="font-semibold">Esta acción es irreversible</span>
                  </AlertDescription>
                </Alert>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>Al eliminar este grupo, se eliminarán permanentemente:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Todos los miembros del grupo</li>
                    <li>Todas las tareas pendientes y completadas</li>
                    <li>Toda la información asociada al grupo</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingGroup}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletingGroup}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingGroup ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Eliminando...
                </span>
              ) : (
                "Eliminar grupo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
