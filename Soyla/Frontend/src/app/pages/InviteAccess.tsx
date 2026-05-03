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
import { ApiError, joinInvite, lookupInvite } from "../lib/api";
import { getActiveSession, touchSession } from "../lib/session";

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
    const timer = window.setTimeout(() => {
      void processInvite();
    }, 800);

    return () => window.clearTimeout(timer);
  }, [inviteCode]);

  const processInvite = async () => {
    if (!inviteCode) {
      setState("invalid");
      return;
    }

    try {
      const invite = await lookupInvite(inviteCode);
      setGroupName(invite.groupName);
      setGroupId(invite.groupId);

      const session = getActiveSession();
      if (!session) {
        localStorage.setItem("pendingInviteCode", inviteCode);
        setState("unauthenticated");
        return;
      }

      const response = await joinInvite(inviteCode, {
        userEmail: session.user.email,
      });

      touchSession();
      localStorage.removeItem("pendingInviteCode");

      setGroupName(response.group.name);
      setGroupId(response.group.id);
      setState(response.alreadyMember ? "already_member" : "success");
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        if (caughtError.status === 401) {
          localStorage.setItem("pendingInviteCode", inviteCode);
          setState("unauthenticated");
          return;
        }

        if (caughtError.status === 410) {
          setState("expired");
          return;
        }
      }

      setState("invalid");
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex flex-col">
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

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {state === "loading" && (
            <Card className="shadow-sm border-purple-100">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl text-gray-800">Validando invitacion...</h2>
                    <p className="text-gray-500 text-sm">
                      Estamos procesando tu enlace de invitacion.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {state === "unauthenticated" && (
            <Card className="shadow-sm border-purple-100">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <LogIn className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl text-gray-800">Inicia sesion para continuar</h2>
                    <p className="text-gray-500 text-sm">
                      Necesitas iniciar sesion para unirte al grupo familiar.
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    <Button
                      onClick={handleGoToLogin}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      Iniciar sesion
                    </Button>
                    <p className="text-xs text-gray-400 text-center">
                      Despues de iniciar sesion, volveras automaticamente a esta invitacion.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {state === "success" && (
            <Card className="shadow-sm border-green-100">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl text-gray-800">Te has unido al grupo</h2>
                    <p className="text-gray-500 text-sm">
                      Ahora eres miembro de{" "}
                      <span className="text-purple-600 font-medium">{groupName}</span>.
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

          {state === "invalid" && (
            <Card className="shadow-sm border-red-100">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl text-red-600">Enlace no valido</h2>
                    <p className="text-gray-500 text-sm">
                      El enlace de invitacion que usaste no es valido o ya no existe.
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    <Button
                      onClick={handleGoHome}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Volver al inicio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                      Este enlace de invitacion ha superado su vigencia de 72 horas.
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    <Button
                      onClick={handleGoHome}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Solicitar nuevo enlace
                    </Button>
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
