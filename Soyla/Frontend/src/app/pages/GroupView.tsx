import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Home, Users, LogOut, UserPlus, Copy, CheckCheck, Clock, Link2 } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { CreateTaskForm } from "../components/CreateTaskForm";
import { MembersList } from "../components/MembersList";
import { TasksList } from "../components/TasksList";
import {
  createInvite,
  getActiveInvite,
  getGroup,
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
  const [inviteLink, setInviteLink] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState<number | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [tasksRefreshTrigger, setTasksRefreshTrigger] = useState(0);

  useEffect(() => {
    const session = getActiveSession();
    if (!session || !groupId) {
      navigate("/");
      return;
    }

    setUserName(session.user.fullName);
    setUserEmail(session.user.email);

    const loadGroupData = async () => {
      const [loadedGroup, members] = await Promise.all([
        getGroup(groupId),
        listGroupMembers(groupId),
      ]);

      setGroup(loadedGroup);
      setMemberCount(members.length);
      const currentMember = members.find((member) => member.email === session.user.email);
      if (!currentMember) {
        navigate("/home");
        return;
      }

      setUserRole(currentMember.role);

      try {
        const invite = await getActiveInvite(groupId);
        setInviteLink(`${window.location.origin}/unirse/${invite.code}`);
        setInviteExpiresAt(new Date(invite.expiresAt).getTime());
      } catch {
        setInviteLink("");
        setInviteExpiresAt(null);
      }
    };

    void loadGroupData();
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
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = inviteLink;
      textarea.style.position = "fixed";
      textarea.style.left = "-999999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  const hoursLeft = inviteExpiresAt
    ? Math.max(0, Math.ceil((inviteExpiresAt - Date.now()) / 3600000))
    : 0;

  if (!group) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="bg-white/40 backdrop-blur-sm border-b border-purple-100/50">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <AppLogo size="sm" showTagline={false} />
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/home")}
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
                {userName.trim().split(" ").filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join("")}
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

      <div className="container mx-auto max-w-6xl px-6 py-8">
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
          <Card className="shadow-sm border-purple-100">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Gestion de miembros
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {memberCount === 1 ? "1 miembro en el grupo" : `${memberCount} miembros en el grupo`}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => void handleInvite()}
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

            {showInvite && (
              <CardContent className="pt-0 pb-6">
                <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-purple-500 shrink-0" />
                    <p className="text-sm text-gray-700">
                      Comparte este enlace con los miembros que deseas invitar:
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-purple-100 rounded-lg px-3 py-2.5 overflow-hidden">
                      <p className="text-xs text-gray-600 truncate select-all font-mono">
                        {inviteLink}
                      </p>
                    </div>
                    <Button
                      onClick={() => void handleCopy()}
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

                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Enlace valido por <span className="text-purple-500 font-medium">{hoursLeft} hora{hoursLeft !== 1 ? "s" : ""}</span> mas
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <MembersList
            groupId={groupId || ""}
            currentUserEmail={userEmail}
            currentUserRole={userRole}
          />

          <TasksList groupId={groupId || ""} refreshTrigger={tasksRefreshTrigger} />

          <Card className="shadow-sm border-purple-100">
            <CardHeader>
              <CardTitle className="text-xl">Crear nueva tarea</CardTitle>
              <CardDescription>
                Organiza las responsabilidades del hogar entre los miembros del grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTaskForm
                groupId={groupId || ""}
                onTaskCreated={() => setTasksRefreshTrigger((prev) => prev + 1)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
