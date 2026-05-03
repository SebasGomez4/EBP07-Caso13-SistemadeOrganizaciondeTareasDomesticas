import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ApiError, createGroup } from "../lib/api";
import { getActiveSession } from "../lib/session";

export function CreateGroup() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getActiveSession()) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!groupName.trim()) {
      setError("Por favor, ingresa un nombre para el grupo familiar");
      return;
    }

    const session = getActiveSession();
    if (!session) {
      navigate("/");
      return;
    }

    setLoading(true);

    try {
      const newGroup = await createGroup({
        name: groupName.trim(),
        createdByEmail: session.user.email,
      });

      localStorage.setItem("lastCreatedGroup", JSON.stringify(newGroup));
      navigate("/grupo-creado");
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "No fue posible crear el grupo familiar."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-purple-100">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/home")}
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
                placeholder="Ej: Familia Garcia"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={loading}
                autoFocus
                className="h-11"
              />
              <p className="text-sm text-gray-500 mt-3">
                Este nombre identificara a tu grupo familiar
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
              onClick={() => navigate("/home")}
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
