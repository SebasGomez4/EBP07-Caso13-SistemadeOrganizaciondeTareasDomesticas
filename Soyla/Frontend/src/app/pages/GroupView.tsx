import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, CheckCheck, Clock, Copy, Home, Link2, LogOut, Trash2, UserMinus, Users } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
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
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { AppLogo } from "../components/AppLogo";
import { CreateTaskForm } from "../components/CreateTaskForm";
import { MembersList } from "../components/MembersList";
import { NotificationBell } from "../components/NotificationBell";
import { TasksList } from "../components/TasksList";
import { WeeklyRankingForm } from "../components/WeeklyRankingForm";
import { WeeklyRankingView } from "../components/WeeklyRankingView";
import {
  createInvite,
  deleteGroup,
  getActiveInvite,
  getGroup,
  leaveGroup,
  listGroupMembers,
  type FamilyGroup,
} from "../lib/api";
import { clearSession, getActiveSession, markLogoutSuccess } from "../lib/session";

export function GroupView() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<"Administrador" | "Coadministrador" | "Colaborador">("Colaborador");
  const [memberCount, setMemberCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState<number | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [tasksRefreshTrigger, setTasksRefreshTrigger] = useState(0);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [working, setWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const reload = async (email: string, id: string) => {
    const [loadedGroup, members] = await Promise.all([getGroup(id), listGroupMembers(id)]);
    const currentMember = members.find((member) => member.email === email);
    if (!currentMember) {
      navigate("/home");
      return;
    }
    setGroup(loadedGroup);
    setMemberCount(members.length);
    setAdminCount(members.filter((member) => member.role === "Administrador").length);
    setUserRole(currentMember.role);
  };

  useEffect(() => {
    const session = getActiveSession();
    if (!session || !groupId) {
      navigate("/");
      return;
    }
    setUserName(session.user.fullName);
    setUserEmail(session.user.email);
    void reload(session.user.email, groupId);
    void getActiveInvite(groupId)
      .then((invite) => {
        setInviteLink(`${window.location.origin}/unirse/${invite.code}`);
        setInviteExpiresAt(new Date(invite.expiresAt).getTime());
      })
      .catch(() => {
        setInviteLink("");
        setInviteExpiresAt(null);
      });
    localStorage.removeItem("lastCreatedGroup");
  }, [groupId, navigate]);

  const handleLogout = () => {
    clearSession();
    markLogoutSuccess();
    navigate("/");
  };

  const handleInvite = async () => {
    if (!groupId) return;
    if (showInvite) {
      setShowInvite(false);
      return;
    }
    setGeneratingInvite(true);
    try {
      const invite = await createInvite(groupId);
      setInviteLink(`${window.location.origin}/unirse/${invite.code}`);
      setInviteExpiresAt(new Date(invite.expiresAt).getTime());
      setShowInvite(true);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmLeave = async () => {
    if (!groupId) return;
    setWorking(true);
    setErrorMessage("");
    try {
      await leaveGroup(groupId, userEmail);
      navigate("/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo abandonar el grupo.");
    } finally {
      setWorking(false);
      setShowLeaveDialog(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!groupId) return;
    setWorking(true);
    setErrorMessage("");
    try {
      await deleteGroup(groupId, { requestedByEmail: userEmail });
      navigate("/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo eliminar el grupo.");
    } finally {
      setWorking(false);
      setShowDeleteDialog(false);
    }
  };

  const hoursLeft = inviteExpiresAt ? Math.max(0, Math.ceil((inviteExpiresAt - Date.now()) / 3600000)) : 0;
  const isOnlyAdmin = userRole === "Administrador" && adminCount <= 1;

  if (!group) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="bg-white/40 backdrop-blur-sm border-b border-purple-100/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <AppLogo size="sm" showTagline={false} />
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={() => navigate("/home")} className="border-purple-200 hover:bg-purple-50">
              <Home className="h-4 w-4 mr-1.5" />Inicio
            </Button>
            <NotificationBell currentUserEmail={userEmail} />
            <button onClick={() => navigate("/perfil")} title={userName} className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{userName.trim().split(" ").filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join("")}</span>
            </button>
            <Button variant="outline" onClick={handleLogout} className="border-purple-200 hover:bg-purple-50">
              <LogOut className="h-4 w-4 mr-1.5" />Cerrar sesion
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        {errorMessage && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent py-1 leading-tight">{group.name}</h1>
              <p className="text-sm text-gray-500">Grupo familiar · {memberCount} miembro{memberCount !== 1 ? "s" : ""} · Rol: {userRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowLeaveDialog(true)} className="border-orange-200 text-orange-700 hover:bg-orange-50">
              <UserMinus className="h-4 w-4 mr-1.5" />Abandonar
            </Button>
            {userRole === "Administrador" && (
              <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="border-red-200 text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-1.5" />Eliminar grupo
              </Button>
            )}
          </div>
        </div>

        <Card className="shadow-sm border-purple-100">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-xl flex items-center gap-2"><Users className="h-5 w-5 text-purple-500" />Gestion de miembros</CardTitle>
                <CardDescription>Invita, consulta y administra integrantes del grupo</CardDescription>
              </div>
              <Button onClick={() => void handleInvite()} disabled={generatingInvite} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Copy className="h-4 w-4 mr-1.5" />{showInvite ? "Ocultar enlace" : "Generar enlace"}
              </Button>
            </div>
          </CardHeader>
          {showInvite && (
            <CardContent className="pt-0">
              <div className="bg-purple-50/70 border border-purple-100 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-700"><Link2 className="h-4 w-4 text-purple-500" />Comparte este enlace con los miembros que deseas invitar:</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-purple-100 rounded-lg px-3 py-2 overflow-hidden">
                    <p className="text-xs text-gray-600 truncate select-all font-mono">{inviteLink}</p>
                  </div>
                  <Button onClick={() => void handleCopy()} variant="outline" className="border-purple-200 hover:bg-purple-50">
                    {copied ? <CheckCheck className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />Enlace valido por {hoursLeft} hora{hoursLeft !== 1 ? "s" : ""} mas
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TasksList
              groupId={groupId || ""}
              refreshTrigger={tasksRefreshTrigger}
              currentUserRole={userRole}
              currentUserEmail={userEmail}
              createTaskButton={<CreateTaskForm groupId={groupId || ""} onTaskCreated={() => setTasksRefreshTrigger((prev) => prev + 1)} />}
            />
          </div>
          <div className="space-y-6">
            <MembersList groupId={groupId || ""} currentUserEmail={userEmail} currentUserRole={userRole} />
            <WeeklyRankingView groupId={groupId || ""} currentUserEmail={userEmail} refreshTrigger={tasksRefreshTrigger} />
            <WeeklyRankingForm
              groupId={groupId || ""}
              currentUserRole={userRole}
              currentUserEmail={userEmail}
              onRankingCreated={() => setTasksRefreshTrigger((prev) => prev + 1)}
            />
          </div>
        </div>
      </main>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {isOnlyAdmin ? <AlertTriangle className="h-5 w-5 text-orange-500" /> : <UserMinus className="h-5 w-5" />}
              {isOnlyAdmin ? "No puedes abandonar el grupo" : "Deseas abandonar este grupo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isOnlyAdmin
                ? "Debes transferir la administracion antes de abandonar el grupo."
                : `Al abandonar "${group.name}", perderas acceso a sus tareas y actividades.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>{isOnlyAdmin ? "Entendido" : "Cancelar"}</AlertDialogCancel>
            {!isOnlyAdmin && (
              <AlertDialogAction onClick={() => void handleConfirmLeave()} disabled={working} className="bg-red-600 hover:bg-red-700">
                {working ? "Abandonando..." : "Confirmar"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-red-600" />Eliminar grupo "{group.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion es irreversible. Se eliminaran miembros, tareas, clasificaciones y notificaciones asociadas al grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmDelete()} disabled={working} className="bg-red-600 hover:bg-red-700">
              {working ? "Eliminando..." : "Eliminar grupo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
