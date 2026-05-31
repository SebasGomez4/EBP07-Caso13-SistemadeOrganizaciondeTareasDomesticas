import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertCircle, CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { ApiError, confirmEmail, resendConfirmation } from "../lib/api";

type ConfirmationState = "loading" | "success" | "expired" | "invalid";

export function ConfirmEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<ConfirmationState>("loading");
  const [userEmail, setUserEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendUrl, setResendUrl] = useState("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    void confirmEmail(token)
      .then((response) => {
        setUserEmail(response.email);
        setState("success");
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 410) {
          setState("expired");
          return;
        }
        setState("invalid");
      });
  }, [token]);

  const handleResendEmail = async () => {
    if (!userEmail) return;
    setResending(true);
    try {
      const response = await resendConfirmation(userEmail);
      setResendUrl(response.confirmationUrl ? `${window.location.origin}${response.confirmationUrl}` : "");
    } finally {
      setResending(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-purple-100">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
            <p className="text-lg text-gray-700">Verificando tu cuenta...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "success") {
    return (
      <Shell>
        <Card className="w-full shadow-lg border-green-100">
          <CardHeader className="pb-4 text-center">
            <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-3" />
            <CardTitle className="text-2xl text-green-900">Cuenta activada</CardTitle>
            <CardDescription>Tu correo electronico ha sido confirmado exitosamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-8">
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
              <p className="text-sm text-green-700 mb-1">Cuenta verificada:</p>
              <p className="text-base font-medium text-green-900">{userEmail}</p>
            </div>
            <Button onClick={() => navigate("/")} className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              Continuar al inicio de sesion
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (state === "expired") {
    return (
      <Shell>
        <Card className="w-full shadow-lg border-orange-100">
          <CardHeader className="pb-4 text-center">
            <AlertCircle className="h-14 w-14 text-orange-600 mx-auto mb-3" />
            <CardTitle className="text-2xl text-orange-900">Enlace expirado</CardTitle>
            <CardDescription>Este enlace de confirmacion ya no es valido.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-8">
            <p className="text-sm text-orange-800 bg-orange-50 border border-orange-100 rounded-lg p-4">
              Los enlaces de confirmacion son validos por 24 horas por seguridad.
            </p>
            {resendUrl && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Nuevo enlace para desarrollo:</p>
                <a href={resendUrl} className="text-xs text-purple-700 break-all hover:underline">{resendUrl}</a>
              </div>
            )}
            <Input
              type="email"
              value={userEmail}
              onChange={(event) => setUserEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              className="h-11"
            />
            <Button onClick={() => void handleResendEmail()} disabled={resending || !userEmail.trim()} className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
              {resending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Reenviar correo de confirmacion
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full h-11">Volver al inicio de sesion</Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card className="w-full shadow-lg border-red-100">
        <CardHeader className="pb-4 text-center">
          <XCircle className="h-14 w-14 text-red-600 mx-auto mb-3" />
          <CardTitle className="text-2xl text-red-900">Enlace invalido</CardTitle>
          <CardDescription>El enlace de confirmacion no es valido o ya fue utilizado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-6 pb-8">
          <Button onClick={() => navigate("/register")} className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            Volver al registro
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full h-11">Ir al inicio de sesion</Button>
        </CardContent>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <AppLogo size="md" variant="horizontal" showTagline={true} />
        </div>
        {children}
      </div>
    </div>
  );
}
