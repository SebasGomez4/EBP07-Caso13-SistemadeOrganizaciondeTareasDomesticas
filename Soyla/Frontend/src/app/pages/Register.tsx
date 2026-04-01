import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, UserPlus } from "lucide-react";
import { AppLogo } from "../components/AppLogo";

interface User {
  fullName: string;
  email: string;
  password: string;
}

export function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
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

    // Validación de contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
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
        {/* Logo de la aplicación con mayor protagonismo */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3 py-2 leading-tight">
            Soyla
          </h1>
          <p className="text-gray-600 text-base">
            Sistema de gestión de tareas domésticas
          </p>
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
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11"
              />
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