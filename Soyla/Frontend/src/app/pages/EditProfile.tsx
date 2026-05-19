import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { LogOut, Home, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { SecurityIndicator } from "../components/SecurityIndicator";

const SESSION_TIMEOUT = 300000;

interface StoredUser {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

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
  // Formato estándar: algo@dominio.tld (al menos un punto después del @)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  // Acepta formatos: vacío (opcional), 7–15 dígitos con opcionales +, espacios, guiones
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

  // ── Inicialización ────────────────────────────────────────────────────────
  useEffect(() => {
    const session = localStorage.getItem("currentSession");
    if (!session) {
      navigate("/");
      return;
    }

    const sessionData = JSON.parse(session);
    const now = Date.now();

    if (now - sessionData.lastActivity >= SESSION_TIMEOUT) {
      localStorage.removeItem("currentSession");
      navigate("/");
      return;
    }

    const sessionEmail: string = sessionData.user.email;
    const sessionName: string = sessionData.user.fullName;

    setUserName(sessionName);
    setCurrentEmail(sessionEmail);

    // Leer datos actuales del usuario (incluyendo teléfono si existe)
    const users: StoredUser[] = JSON.parse(localStorage.getItem("users") || "[]");
    const storedUser = users.find((u) => u.email === sessionEmail);

    setEmail(sessionEmail);
    setPhone(storedUser?.phone ?? "");

    setPageLoading(false);
  }, [navigate]);

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

  const handleGoHome = () => navigate("/home");
  const handleGoProfile = () => navigate("/perfil");

  // ── Validación en tiempo real ─────────────────────────────────────────────
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) setEmailError("");
    if (success) setSuccess(false);
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (phoneError) setPhoneError("");
    if (success) setSuccess(false);
  };

  // ── Guardar cambios ───────────────────────────────────────────────────────
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPhoneError("");
    setSuccess(false);

    let hasError = false;

    // Validar correo (Escenario 2)
    if (!email.trim()) {
      setEmailError("El correo electrónico no puede estar vacío.");
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError("El formato del correo no es válido. Ejemplo: usuario@dominio.com");
      hasError = true;
    }

    // Validar teléfono (opcional, pero con formato si se ingresa)
    if (phone.trim() && !isValidPhone(phone)) {
      setPhoneError("El número de teléfono no es válido. Usa entre 7 y 15 dígitos.");
      hasError = true;
    }

    if (hasError) return;

    // Escenario 4: indicador de carga
    setLoading(true);

    // Simular latencia de red
    setTimeout(() => {
      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();

      // Verificar si el nuevo correo ya existe en otro usuario
      const users: StoredUser[] = JSON.parse(localStorage.getItem("users") || "[]");
      const emailAlreadyTaken = users.some(
        (u) => u.email === trimmedEmail && u.email !== currentEmail
      );

      if (emailAlreadyTaken) {
        setEmailError("Este correo ya está registrado por otro usuario.");
        setLoading(false);
        return;
      }

      // Actualizar array de usuarios
      const updatedUsers = users.map((u) => {
        if (u.email === currentEmail) {
          return { ...u, email: trimmedEmail, phone: trimmedPhone };
        }
        return u;
      });
      localStorage.setItem("users", JSON.stringify(updatedUsers));

      // Actualizar sesión activa (Escenario 3: reflejar cambios de inmediato)
      const session = localStorage.getItem("currentSession");
      if (session) {
        const sessionData = JSON.parse(session);
        sessionData.user.email = trimmedEmail;
        sessionData.lastActivity = Date.now();
        localStorage.setItem("currentSession", JSON.stringify(sessionData));
      }

      // Actualizar estado local
      setCurrentEmail(trimmedEmail);
      setLoading(false);
      setSuccess(true);

      // Ocultar éxito tras 4 segundos
      setTimeout(() => setSuccess(false), 4000);
    }, 900);
  };

  // ── Estado: cargando página ───────────────────────────────────────────────
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

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">

      {/* ── Header ── */}
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
            {/* Avatar con acceso al perfil */}
            <button
              onClick={handleGoProfile}
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
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="container mx-auto max-w-6xl px-6 py-12">

        {/* Título de sección */}
        <div className="text-center mb-10">
          <h1 className="text-3xl mb-2">
            Editar{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Perfil
            </span>
          </h1>
          <p className="text-gray-500 text-sm">
            Actualiza tu correo electrónico y número de teléfono
          </p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-sm border-purple-100">
            <CardHeader className="pb-2 pt-8 px-8">
              <CardTitle className="text-lg text-gray-800">Información de contacto</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Modifica los datos que deseas actualizar y presiona{" "}
                <span className="text-purple-600">Guardar Cambios</span>.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8 pt-4">
              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-5">

                  {/* ── Alerta de éxito (Escenario 1 / 3) ── */}
                  {success && (
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-green-700">
                        Tus datos han sido actualizados correctamente.
                      </p>
                    </div>
                  )}

                  {/* ── Campo: Correo electrónico ── */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-gray-700">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@dominio.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
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

                  {/* ── Campo: Número de teléfono ── */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm text-gray-700">
                      Número de teléfono{" "}
                      <span className="text-gray-400 text-xs">(opcional)</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+57 300 000 0000"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
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

                  {/* ── Separador ── */}
                  <div className="border-t border-purple-50 pt-2" />

                  {/* ── Botón principal: Guardar Cambios (Escenarios 1 y 4) ── */}
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

                  {/* ── Botón secundario: volver al perfil ── */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoProfile}
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
            Solo se permite modificar el correo electrónico y el número de teléfono.
          </p>

          {/* Información de protección de datos */}
          <SecurityIndicator variant="detailed" className="mt-6" />
        </div>
      </div>
    </div>
  );
}
