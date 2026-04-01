import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface FamilyGroup {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}

const SESSION_TIMEOUT = 300000; // 5 minutos de inactividad

export function CreateGroup() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    const session = localStorage.getItem("currentSession");
    if (!session) {
      navigate("/");
      return;
    }

    const sessionData = JSON.parse(session);
    const now = Date.now();

    // Verificar si la sesión ha expirado
    if (now - sessionData.lastActivity >= SESSION_TIMEOUT) {
      localStorage.removeItem("currentSession");
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Escenario 3: Validación de nombre vacío
    if (!groupName.trim()) {
      setError("Por favor, ingresa un nombre para el grupo familiar");
      return;
    }

    setLoading(true);

    // Escenario 4: Tiempo de respuesta <= 3 segundos
    // Simulamos 2.5 segundos para estar dentro del límite
    setTimeout(() => {
      const session = localStorage.getItem("currentSession");
      if (!session) {
        navigate("/");
        return;
      }

      const sessionData = JSON.parse(session);

      // Escenario 1: Crear grupo familiar exitosamente
      const newGroup: FamilyGroup = {
        id: `group_${Date.now()}`,
        name: groupName.trim(),
        createdBy: sessionData.user.email,
        createdAt: Date.now(),
      };

      // Guardar el grupo en localStorage
      const groups = JSON.parse(localStorage.getItem("familyGroups") || "[]");
      groups.push(newGroup);
      localStorage.setItem("familyGroups", JSON.stringify(groups));

      // Guardar el grupo recién creado temporalmente para la pantalla de confirmación
      localStorage.setItem("lastCreatedGroup", JSON.stringify(newGroup));

      setLoading(false);

      // Redirigir a la pantalla de confirmación
      navigate("/grupo-creado");
    }, 2500);
  };

  // Escenario 2: Cancelar el proceso de creación
  const handleCancel = () => {
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-purple-100">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="p-0 h-auto hover:bg-transparent"
              disabled={loading}
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 hover:text-gray-800" />
            </Button>
          </div>
          <CardTitle className="text-2xl text-center">Crear grupo familiar</CardTitle>
          <CardDescription className="text-center">
            Ingresa el nombre de tu grupo familiar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-6">
            {/* Escenario 5: Mensajes claros y comprensibles */}
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="groupName">Nombre del grupo</Label>
              <Input
                id="groupName"
                type="text"
                placeholder="Ej: Familia García"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={loading}
                autoFocus
                className="h-11"
              />
              <p className="text-sm text-gray-500 mt-3">
                Este nombre identificará a tu grupo familiar
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-6 pt-6 pb-6">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? "Creando grupo..." : "Crear grupo"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}