import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Mail } from "lucide-react";
import { AppLogo } from "../components/AppLogo";

interface User {
  fullName: string;
  email: string;
  password: string;
  status: "pending" | "active";
  createdAt: number;
}

interface EmailConfirmationToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  createdAt: number;
  expiresAt: number;
}

type ConfirmationState = "loading" | "success" | "expired" | "invalid";

export function ConfirmEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<ConfirmationState>("loading");
  const [userEmail, setUserEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    // Simular tiempo de procesamiento (< 2s)
    setTimeout(() => {
      verifyAndActivateAccount(token);
    }, 800);
  }, [token]);

  const verifyAndActivateAccount = (tokenString: string) => {
    const tokens: EmailConfirmationToken[] = JSON.parse(
      localStorage.getItem("emailConfirmationTokens") || "[]"
    );

    // Buscar token
    const tokenRecord = tokens.find((t) => t.token === tokenString);

    if (!tokenRecord) {
      setState("invalid");
      return;
    }

    const now = Date.now();

    // Escenario 3: Verificar si el enlace expiró (24h)
    if (now > tokenRecord.expiresAt) {
      setUserEmail(tokenRecord.email);
      setState("expired");
      return;
    }

    // ── Escenario 2: Activar cuenta ──
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
    const userIndex = users.findIndex((u) => u.email === tokenRecord.email);

    if (userIndex === -1) {
      setState("invalid");
      return;
    }

    // Cambiar estado a "active"
    users[userIndex].status = "active";
    localStorage.setItem("users", JSON.stringify(users));

    // Eliminar token usado (seguridad)
    const updatedTokens = tokens.filter((t) => t.id !== tokenRecord.id);
    localStorage.setItem("emailConfirmationTokens", JSON.stringify(updatedTokens));

    setUserEmail(tokenRecord.email);
    setState("success");
  };

  // ── Escenario 3: Reenviar correo de confirmación ──
  const handleResendEmail = () => {
    setResending(true);
    setResendSuccess(false);

    setTimeout(() => {
      // Buscar usuario por email
      const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u) => u.email === userEmail);

      if (!user) {
        setResending(false);
        return;
      }

      // Eliminar tokens anteriores del mismo email
      const tokens: EmailConfirmationToken[] = JSON.parse(
        localStorage.getItem("emailConfirmationTokens") || "[]"
      );
      const filteredTokens = tokens.filter((t) => t.email !== userEmail);

      // Generar nuevo token
      const now = Date.now();
      const newToken: EmailConfirmationToken = {
        id: `token-${now}-${Math.random().toString(36).substr(2, 9)}`,
        userId: `user-${userEmail}`,
        email: userEmail,
        token: Math.random().toString(36).substr(2, 20) + now.toString(36),
        createdAt: now,
        expiresAt: now + (24 * 60 * 60 * 1000),
      };

      filteredTokens.push(newToken);
      localStorage.setItem("emailConfirmationTokens", JSON.stringify(filteredTokens));

      const confirmUrl = `${window.location.origin}/confirm-email/${newToken.token}`;
      console.log(`[SIMULADO] Correo reenviado a ${userEmail}:`);
      console.log(`  Asunto: Confirma tu registro en Soyla`);
      console.log(`  Enlace: ${confirmUrl}`);

      setResending(false);
      setResendSuccess(true);

      // Ocultar mensaje de éxito después de 5s
      setTimeout(() => setResendSuccess(false), 5000);
    }, 1000);
  };

  // ── Estado de carga ──
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-purple-100">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
            <p className="text-lg text-gray-700">Verificando tu cuenta...</p>
            <p className="text-sm text-gray-500">Esto solo tomará un momento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Escenario 2: Confirmación exitosa ──
  if (state === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <AppLogo size="md" variant="horizontal" showTagline={true} />
          </div>

          <Card className="w-full shadow-lg border-green-100">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-9 w-9 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center text-green-900">
                ¡Cuenta activada!
              </CardTitle>
              <CardDescription className="text-center text-base">
                Tu correo electrónico ha sido confirmado exitosamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-8">
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700 mb-1">Cuenta verificada:</p>
                <p className="text-base font-medium text-green-900">{userEmail}</p>
              </div>

              <p className="text-sm text-gray-700 text-center">
                Ya puedes iniciar sesión y comenzar a organizar tus tareas domésticas
              </p>

              <Button
                onClick={() => navigate("/")}
                className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Continuar al inicio de sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Escenario 3: Enlace expirado ──
  if (state === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <AppLogo size="md" variant="horizontal" showTagline={true} />
          </div>

          <Card className="w-full shadow-lg border-orange-100">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="h-9 w-9 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center text-orange-900">
                Enlace expirado
              </CardTitle>
              <CardDescription className="text-center text-base">
                Este enlace de confirmación ya no es válido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-8">
              {resendSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    Correo reenviado exitosamente. Revisa tu bandeja de entrada.
                  </p>
                </div>
              )}

              <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 space-y-2">
                <p className="text-sm text-orange-800">
                  Los enlaces de confirmación son válidos por <span className="font-semibold">24 horas</span> por motivos de seguridad.
                </p>
                <p className="text-sm text-orange-700">
                  Puedes solicitar un nuevo correo de confirmación usando el botón de abajo.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">Cuenta asociada:</p>
                <p className="text-sm font-medium text-gray-900">{userEmail}</p>
              </div>

              <Button
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
              >
                {resending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Reenviar correo de confirmación
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full h-11 border-gray-200 hover:bg-gray-50"
              >
                Volver al inicio de sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Estado inválido o error ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <AppLogo size="md" variant="horizontal" showTagline={true} />
        </div>

        <Card className="w-full shadow-lg border-red-100">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-9 w-9 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-red-900">
              Enlace inválido
            </CardTitle>
            <CardDescription className="text-center text-base">
              El enlace de confirmación no es válido o ya fue utilizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-8">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Este enlace no existe, ya fue utilizado anteriormente, o no es un enlace válido de confirmación.
              </p>
            </div>

            <p className="text-sm text-gray-700 text-center">
              Si acabas de registrarte, revisa tu correo y usa el enlace más reciente.
            </p>

            <Button
              onClick={() => navigate("/register")}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Volver al registro
            </Button>

            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full h-11 border-gray-200 hover:bg-gray-50"
            >
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
