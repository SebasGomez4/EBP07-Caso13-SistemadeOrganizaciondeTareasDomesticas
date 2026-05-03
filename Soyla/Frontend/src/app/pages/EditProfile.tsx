import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { LogOut, Home, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { ApiError, getUserProfile, updateUserProfile } from "../lib/api";
import { clearSession, getActiveSession, markLogoutSuccess, updateSessionUser } from "../lib/session";

function getInitials(name: string): string {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return cleaned === "" || /^\+?\d{7,15}$/.test(cleaned);
}

export function EditProfile() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const session = getActiveSession();
    if (!session) {
      navigate("/");
      return;
    }

    setUserName(session.user.fullName);
    setCurrentEmail(session.user.email);

    const loadProfile = async () => {
      const profile = await getUserProfile(session.user.email);
      setEmail(profile.email);
      setPhone(profile.phone ?? "");
      setPageLoading(false);
    };

    void loadProfile();
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPhoneError("");
    setSuccess(false);

    let hasError = false;

    if (!email.trim()) {
      setEmailError("El correo electronico no puede estar vacio.");
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError("El formato del correo no es valido. Ejemplo: usuario@dominio.com");
      hasError = true;
    }

    if (phone.trim() && !isValidPhone(phone)) {
      setPhoneError("El numero de telefono no es valido. Usa entre 7 y 15 digitos.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const session = getActiveSession();
    if (!session) {
      navigate("/");
      return;
    }

    setLoading(true);

    try {
      const updatedUser = await updateUserProfile(currentEmail, {
        email: email.trim(),
        phone: phone.trim(),
      });

      updateSessionUser({
        fullName: session.user.fullName,
        email: updatedUser.email,
      });

      setCurrentEmail(updatedUser.email);
      setEmail(updatedUser.email);
      setPhone(updatedUser.phone ?? "");
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 4000);
    } catch (caughtError) {
      const message = caughtError instanceof ApiError
        ? caughtError.message
        : "No fue posible actualizar el perfil.";

      if (message.toLowerCase().includes("correo")) {
        setEmailError(message);
      } else {
        setPhoneError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    markLogoutSuccess();
    navigate("/");
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-purple-200 to-blue-200 animate-pulse" />
          <p className="text-gray-500 text-sm">Cargando formulario...</p>
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
              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center hover:opacity-90 transition-opacity ring-2 ring-purple-200 hover:ring-purple-400 focus:outline-none"
            >
              <span className="text-white text-xs font-semibold select-none">
                {getInitials(userName)}
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
        <div className="text-center mb-10">
          <h1 className="text-3xl mb-2">
            Editar{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Perfil
            </span>
          </h1>
          <p className="text-gray-500 text-sm">
            Actualiza tu correo electronico y numero de telefono
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="shadow-sm border-purple-100">
            <CardHeader className="pb-2 pt-8 px-8">
              <CardTitle className="text-lg text-gray-800">Informacion de contacto</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Modifica los datos que deseas actualizar y presiona{" "}
                <span className="text-purple-600">Guardar Cambios</span>.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8 pt-4">
              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-5">
                  {success && (
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-green-700">
                        Tus datos han sido actualizados correctamente.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-gray-700">
                      Correo electronico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@dominio.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                        if (success) setSuccess(false);
                      }}
                      disabled={loading}
                      className={`h-11 transition-colors ${
                        emailError
                          ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                          : "border-purple-100 focus:border-purple-300 focus:ring-purple-100"
                      }`}
                    />
                    {emailError && (
                      <div className="flex items-start gap-2 mt-1">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-600">{emailError}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm text-gray-700">
                      Numero de telefono <span className="text-gray-400 text-xs">(opcional)</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+57 300 000 0000"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (phoneError) setPhoneError("");
                        if (success) setSuccess(false);
                      }}
                      disabled={loading}
                      className={`h-11 transition-colors ${
                        phoneError
                          ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                          : "border-purple-100 focus:border-purple-300 focus:ring-purple-100"
                      }`}
                    />
                    {phoneError && (
                      <div className="flex items-start gap-2 mt-1">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-600">{phoneError}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-purple-50 pt-2" />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/perfil")}
                    disabled={loading}
                    className="w-full h-11 border-purple-200 hover:bg-purple-50 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al perfil
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-xs text-gray-400 text-center mt-5">
            Solo se permite modificar el correo electronico y el numero de telefono.
          </p>
        </div>
      </div>
    </div>
  );
}
