import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, UserPlus, Check, X } from "lucide-react";
import { AppLogo } from "../components/AppLogo";

interface User {
  fullName: string;
  email: string;
  password: string;
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

      // Guardar nuevo usuario
      const newUser: User = {
        fullName,
        email,
        password,
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      setSuccess(true);
      setLoading(false);

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      {success ? (
        <Card className="w-full max-w-sm shadow-lg text-center">
          <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <UserPlus className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-xl text-gray-900">¡Registro exitoso!</p>
          </CardContent>
        </Card>
      ) : (
      <div className="w-full max-w-md">
        {/* Logo de la aplicación */}
        <div className="flex justify-center mb-8">
          <AppLogo size="md" variant="horizontal" showTagline={true} />
        </div>

      <Card className="w-full shadow-lg border-purple-100">
        <CardHeader className="space-y-3 pb-6">
          <CardTitle className="text-2xl text-center">Crear cuenta</CardTitle>
          <CardDescription className="text-center">
            Ingresa tus datos para registrarte
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-6">
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password">Contraseña</Label>
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
                className={`h-11 ${passwordError ? "border-red-500 focus-visible:ring-red-200" : ""}`}
              />

              {/* Mensaje de error de contraseña */}
              {passwordError && (
                <p className="text-sm text-red-600 flex items-start gap-1.5 mt-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {passwordError}
                </p>
              )}

              {/* Reglas de contraseña */}
              <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  La contraseña debe cumplir con:
                </p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-xs">
                    {passwordValidation?.requirements.length ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-gray-400" />
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
                  <li className="flex items-center gap-2 text-xs">
                    {passwordValidation?.requirements.uppercase ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-gray-400" />
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
                  <li className="flex items-center gap-2 text-xs">
                    {passwordValidation?.requirements.lowercase ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-gray-400" />
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
                  <li className="flex items-center gap-2 text-xs">
                    {passwordValidation?.requirements.number ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-gray-400" />
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
                  <li className="flex items-center gap-2 text-xs">
                    {passwordValidation?.requirements.special ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-gray-400" />
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

          <CardFooter className="flex flex-col space-y-5 px-6 pt-8 pb-6">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Registrarse"}
            </Button>

            <p className="text-sm text-center text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
      )}
    </div>
  );
}