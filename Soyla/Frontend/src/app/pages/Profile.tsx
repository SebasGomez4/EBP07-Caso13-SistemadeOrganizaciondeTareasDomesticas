import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { LogOut, Home, ShieldAlert, User, Pencil, Phone, Mail } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { getUserProfile, type UserProfile } from "../lib/api";
import { clearSession, getActiveSession, markLogoutSuccess } from "../lib/session";

function getInitials(name: string): string {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

export function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const session = getActiveSession();
    if (!session) {
      navigate("/");
      return;
    }

    const requestedUid = searchParams.get("uid");
    if (requestedUid && requestedUid !== session.user.email) {
      setUnauthorized(true);
      setLoading(false);
      window.setTimeout(() => navigate("/perfil"), 3000);
      return;
    }

    const loadProfile = async () => {
      const profile = await getUserProfile(session.user.email);
      setUser(profile);
      setLoading(false);
    };

    void loadProfile();
  }, [navigate, searchParams]);

  const handleLogout = () => {
    clearSession();
    markLogoutSuccess();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-purple-200 to-blue-200 animate-pulse" />
          <p className="text-gray-500 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="bg-white/40 backdrop-blur-sm border-b border-purple-100/50">
          <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <AppLogo size="sm" showTagline={false} />
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/home")} className="flex items-center gap-2 border-purple-200 hover:bg-purple-50">
                <Home className="h-4 w-4" />
                Inicio
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 border-purple-200 hover:bg-purple-50">
                <LogOut className="h-4 w-4" />
                Cerrar sesion
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-6xl px-6 py-12 flex justify-center">
          <Card className="shadow-sm border-red-100 max-w-md w-full">
            <CardContent className="pt-10 pb-10">
              <div className="text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                  <ShieldAlert className="h-8 w-8 text-red-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl text-red-600">No autorizado</h2>
                  <p className="text-gray-600 text-sm">No tienes permiso para acceder a este perfil.</p>
                  <p className="text-gray-400 text-xs mt-1">Seras redirigido a tu perfil en unos segundos...</p>
                </div>
                <Button onClick={() => navigate("/perfil")} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 mx-auto">
                  Ir a mi perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="bg-white/40 backdrop-blur-sm border-b border-purple-100/50">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <AppLogo size="sm" showTagline={false} />
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/home")} className="flex items-center gap-2 border-purple-200 hover:bg-purple-50">
              <Home className="h-4 w-4" />
              Inicio
            </Button>
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ring-2 ring-purple-300 cursor-default"
              title={user?.fullName}
            >
              <span className="text-white text-xs font-semibold select-none">
                {user ? getInitials(user.fullName) : "U"}
              </span>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 border-purple-200 hover:bg-purple-50">
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl mb-2">
            Mi{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Perfil
            </span>
          </h1>
          <p className="text-gray-500 text-sm">Informacion personal de tu cuenta</p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="shadow-sm border-purple-100">
            <CardContent className="pt-10 pb-10">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-md ring-4 ring-purple-100">
                    <span className="text-white text-3xl font-semibold select-none">
                      {user ? getInitials(user.fullName) : "U"}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Nombre completo</p>
                  <h2 className="text-2xl bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent">
                    {user?.fullName}
                  </h2>
                </div>

                <div className="w-full border-t border-purple-50" />

                <div className="space-y-1 w-full">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Correo electronico</p>
                  <div className="flex items-center justify-center gap-2 bg-purple-50/60 rounded-xl px-4 py-3 border border-purple-100">
                    <Mail className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="text-gray-700 text-sm break-all">{user?.email}</span>
                  </div>
                </div>

                {user?.phone && (
                  <div className="space-y-1 w-full">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Numero de telefono</p>
                    <div className="flex items-center justify-center gap-2 bg-purple-50/60 rounded-xl px-4 py-3 border border-purple-100">
                      <Phone className="h-4 w-4 text-purple-400 shrink-0" />
                      <span className="text-gray-700 text-sm">{user.phone}</span>
                    </div>
                  </div>
                )}

                <div className="w-full border-t border-purple-50" />

                <Button
                  onClick={() => navigate("/editar-perfil")}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Editar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-gray-400 text-center mt-5">
            Solo se permite editar el correo electronico y el numero de telefono.
          </p>
        </div>
      </div>
    </div>
  );
}
