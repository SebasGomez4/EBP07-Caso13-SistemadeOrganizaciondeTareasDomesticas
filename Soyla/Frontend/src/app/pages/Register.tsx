import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, UserPlus, Check, X, Mail, Clock } from "lucide-react";
import { AppLogo } from "../components/AppLogo";
import { SecurityIndicator } from "../components/SecurityIndicator";

interface User {
  fullName: string;
  email: string;
  password: string;
  status: "pending" | "active"; // HU 1.1.2: Estado de confirmación
  createdAt: number;
}

// HU 1.1.2: Token de confirmación de email
interface EmailConfirmationToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  createdAt: number;
  expiresAt: number;
}

// Lista de contraseñas comunes que deben rechazarse
const COMMON_PASSWORDS = [
  "password", "Password1", "12345678", "qwerty123", "abc123456",
  "password123", "admin123", "letmein123", "welcome123", "monkey123",
  "dragon123", "master123", "sunshine123", "iloveyou", "princess123",
  "football123", "123456789", "1234567890", "12341234", "password1",
  "123123123", "00000000", "11111111", "Passw0rd", "P@ssw0rd",
  "admin1234", "user1234", "test1234", "demo1234", "Welcome1"
];

// Validaciones de complejidad de contraseña
const validatePasswordComplexity = (password: string) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const allValid = Object.values(requirements).every((valid) => valid);

  return { requirements, allValid };
};

const isCommonPassword = (password: string): boolean => {
  const lowerPassword = password.toLowerCase();
  return COMMON_PASSWORDS.some((common) =>
    lowerPassword === common.toLowerCase() ||
    lowerPassword.includes(common.toLowerCase())
  );
};

export function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(""); // HU 1.1.2

  // Calcular requisitos de contraseña en tiempo real
  const passwordValidation = password ? validatePasswordComplexity(password) : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordError("");
    setSuccess(false);

    // Validación de campos vacíos
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos");
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, ingresa un correo electrónico válido");
      return;
    }

    // Validación de complejidad de contraseña
    const validation = validatePasswordComplexity(password);
    if (!validation.allValid) {
      setPasswordError("La contraseña no cumple con los requisitos de seguridad");
      return;
    }

    // Validación de contraseñas comunes
    if (isCommonPassword(password)) {
      setPasswordError("Esta contraseña es muy común o insegura. Por favor, elige una combinación más segura");
      return;
    }

    setLoading(true);

    // Simular tiempo de respuesta del servidor
    setTimeout(() => {
      // Verificar si el correo ya está registrado
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const existingUser = users.find((user: User) => user.email === email);

      if (existingUser) {
        setError("Este correo electrónico ya está registrado");
        setLoading(false);
        return;
      }

      // ── HU 1.1.2: Crear usuario con estado "pending" ──
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const now = Date.now();

      const newUser: User = {
        fullName,
        email,
        password,
        status: "pending", // Escenario 1: cuenta pendiente de activación
        createdAt: now,
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      // ── HU 1.1.2: Generar token de confirmación (válido 24h) ──
      const confirmationToken: EmailConfirmationToken = {
        id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        email,
        token: Math.random().toString(36).substr(2, 20) + Date.now().toString(36),
        createdAt: now,
        expiresAt: now + (24 * 60 * 60 * 1000), // 24 horas (Escenario 3)
      };

      const tokens: EmailConfirmationToken[] = JSON.parse(
        localStorage.getItem("emailConfirmationTokens") || "[]"
      );
      tokens.push(confirmationToken);
      localStorage.setItem("emailConfirmationTokens", JSON.stringify(tokens));

      // ── HU 1.1.2 Escenario 4: Simular envío de correo (< 30s, inmediato en UI) ──
      setRegisteredEmail(email);
      setSuccess(true);
      setLoading(false);

      // Generar URL de confirmación (para demo)
      const confirmUrl = `${window.location.origin}/confirm-email/${confirmationToken.token}`;
      console.log(`[SIMULADO] Correo enviado a ${email}:`);
      console.log(`  Asunto: Confirma tu registro en Soyla`);
      console.log(`  Enlace: ${confirmUrl}`);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      {success ? (
        <Card className="w-full max-w-md shadow-lg border-purple-100">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl text-center">Revisa tu correo electrónico</CardTitle>
            <CardDescription className="text-center text-base">
              Hemos enviado un enlace de confirmación a tu correo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-8">
            {/* Email registrado */}
            <div className="bg-purple-50 border-2 border-purple-100 rounded-lg p-4 sm:p-5 text-center">
              <p className="text-sm text-gray-600 mb-2">Correo enviado a:</p>
              <p className="text-base font-medium text-gray-900 break-words">{registeredEmail}</p>
            </div>

            {/* Instrucciones */}
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Haz clic en el enlace de confirmación que te enviamos para activar tu cuenta
                </span>
              </p>
              <p className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  El enlace es válido por <span className="font-medium">24 horas</span>
                </span>
              </p>
              <p className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Si no ves el correo, revisa tu carpeta de spam o correo no deseado
                </span>
              </p>
            </div>

            {/* Botón volver al login */}
            <div className="pt-2">
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                Volver al inicio de sesión
              </Button>
            </div>

            {/* Link para reenviar correo (opcional - implementar después si se requiere) */}
            <p className="text-xs text-center text-gray-500 pt-2">
              ¿No recibiste el correo?{" "}
              <button className="text-purple-600 hover:text-purple-700 font-medium underline">
                Reenviar correo
              </button>
            </p>
          </CardContent>
        </Card>
      ) : (
      <div className="w-full max-w-md">
        {/* Logo de la aplicación */}
        <div className="flex justify-center mb-8">
          <AppLogo size="md" variant="horizontal" showTagline={true} />
        </div>

      <Card className="w-full shadow-lg border-purple-100">
        <CardHeader className="space-y-4 pb-6">
          <CardTitle className="text-xl sm:text-2xl text-center">Crear cuenta</CardTitle>
          <CardDescription className="text-center text-base">
            Ingresa tus datos para registrarte
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-6">
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                aria-label="Nombre completo"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                aria-label="Correo electrónico"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>

              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                disabled={loading}
                aria-label="Contraseña"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
                className={passwordError ? "border-red-500 focus-visible:ring-red-200" : ""}
              />

              {/* Mensaje de error de contraseña */}
              {passwordError && (
                <p id="password-error" className="text-sm text-red-600 flex items-start gap-2 mt-2" role="alert">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </p>
              )}

              {/* Reglas de contraseña */}
              <div className="mt-4 p-4 bg-gray-50 rounded-md border-2 border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  La contraseña debe cumplir con los siguientes requisitos de seguridad:
                </p>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  Tu contraseña se almacenará de forma segura y nunca en texto plano.
                </p>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2.5 text-sm">
                    {passwordValidation?.requirements.length ? (
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <span
                      className={
                        passwordValidation?.requirements.length
                          ? "text-green-700"
                          : "text-gray-600"
                      }
                    >
                      Mínimo 8 caracteres
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm">
                    {passwordValidation?.requirements.uppercase ? (
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <span
                      className={
                        passwordValidation?.requirements.uppercase
                          ? "text-green-700"
                          : "text-gray-600"
                      }
                    >
                      Al menos una letra mayúscula
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm">
                    {passwordValidation?.requirements.lowercase ? (
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <span
                      className={
                        passwordValidation?.requirements.lowercase
                          ? "text-green-700"
                          : "text-gray-600"
                      }
                    >
                      Al menos una letra minúscula
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm">
                    {passwordValidation?.requirements.number ? (
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <span
                      className={
                        passwordValidation?.requirements.number
                          ? "text-green-700"
                          : "text-gray-600"
                      }
                    >
                      Al menos un número
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm">
                    {passwordValidation?.requirements.special ? (
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <span
                      className={
                        passwordValidation?.requirements.special
                          ? "text-green-700"
                          : "text-gray-600"
                      }
                    >
                      Al menos un carácter especial (!@#$%^&*...)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-6 px-6 pt-8 pb-6">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading}
              size="lg"
            >
              {loading ? "Registrando..." : "Registrarse"}
            </Button>

            <p className="text-sm sm:text-base text-center text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 rounded">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Información de protección de datos */}
      <SecurityIndicator variant="detailed" className="mt-6" />

      {/* Indicador de conexión segura */}
      <SecurityIndicator variant="minimal" className="mt-4" />
      </div>
      )}
    </div>
  );
}