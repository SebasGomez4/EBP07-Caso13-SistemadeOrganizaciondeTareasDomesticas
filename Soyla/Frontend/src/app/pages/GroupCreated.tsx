import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { getActiveSession } from "../lib/session";

export function GroupCreated() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    if (!getActiveSession()) {
      navigate("/");
      return;
    }

    const lastGroup = localStorage.getItem("lastCreatedGroup");
    if (!lastGroup) {
      navigate("/home");
      return;
    }

    const groupData = JSON.parse(lastGroup) as { id: string; name: string };
    setGroupName(groupData.name);
    setGroupId(groupData.id);
  }, [navigate]);

  const handleEnterGroup = () => {
    navigate(`/grupo/${groupId}`);
  };

  const handleGoHome = () => {
    localStorage.removeItem("lastCreatedGroup");
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-purple-100">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Grupo creado exitosamente</CardTitle>
          <CardDescription className="text-base">
            Tu grupo familiar esta listo para ser utilizado
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-100">
            <p className="text-sm text-gray-600 mb-2">Nombre del grupo:</p>
            <p className="text-xl font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {groupName}
            </p>
          </div>

          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Ahora puedes administrar las tareas del hogar con tu grupo familiar
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleEnterGroup}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center justify-center gap-2"
            >
              Entrar al grupo
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button onClick={handleGoHome} variant="outline" className="w-full">
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
