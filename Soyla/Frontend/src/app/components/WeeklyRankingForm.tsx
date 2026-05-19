import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Trophy, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface WeeklyRankingFormProps {
  groupId: string;
  currentUserRole: "Administrador" | "Coadministrador" | "Colaborador";
}

interface WeeklyRanking {
  id: string;
  groupId: string;
  pointsPerTask: number;
  weeklyGoal: number;
  startDate: number;
  endDate: number;
  active: boolean;
  createdAt: number;
}

export function WeeklyRankingForm({ groupId, currentUserRole }: WeeklyRankingFormProps) {
  const [pointsPerTask, setPointsPerTask] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [errors, setErrors] = useState<{ pointsPerTask?: string; weeklyGoal?: string }>({});
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeRanking, setActiveRanking] = useState<WeeklyRanking | null>(null);
  const [showActiveWarning, setShowActiveWarning] = useState(false);

  // Solo administradores pueden ver este componente
  if (currentUserRole !== "Administrador") {
    return null;
  }

  // Función para verificar clasificación activa
  const checkActiveRanking = () => {
    const rankings: WeeklyRanking[] = JSON.parse(
      localStorage.getItem("weeklyRankings") || "[]"
    );
    const active = rankings.find((r) => r.groupId === groupId && r.active);
    setActiveRanking(active || null);
  };

  useEffect(() => {
    // Verificar inicialmente
    checkActiveRanking();

    // Escuchar evento de finalización de ranking
    const handleRankingFinalized = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.groupId === groupId) {
        checkActiveRanking();
      }
    };

    window.addEventListener("rankingFinalized", handleRankingFinalized);

    // Verificar periódicamente cada 5 segundos por si la clasificación expira
    const interval = setInterval(checkActiveRanking, 5000);

    return () => {
      window.removeEventListener("rankingFinalized", handleRankingFinalized);
      clearInterval(interval);
    };
  }, [groupId]);

  // Validación de puntos por tarea
  const validatePointsPerTask = (value: string): string | null => {
    if (!value.trim()) {
      return "Los puntos por tarea son obligatorios";
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue <= 0) {
      return "Debe ser un número mayor a 0";
    }

    if (numValue > 1000) {
      return "El máximo de puntos por tarea es 1000";
    }

    return null;
  };

  // Validación de meta semanal
  const validateWeeklyGoal = (value: string): string | null => {
    if (!value.trim()) {
      return "La meta semanal es obligatoria";
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue <= 0) {
      return "Debe ser un número mayor a 0";
    }

    if (numValue > 10000) {
      return "El máximo de meta semanal es 10000";
    }

    return null;
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Escenario 2: Restricción de múltiples clasificaciones activas
    if (activeRanking) {
      setShowActiveWarning(true);
      setTimeout(() => {
        setShowActiveWarning(false);
      }, 5000);
      return;
    }

    // Validar campos
    const pointsError = validatePointsPerTask(pointsPerTask);
    const goalError = validateWeeklyGoal(weeklyGoal);

    const newErrors: { pointsPerTask?: string; weeklyGoal?: string } = {};
    if (pointsError) newErrors.pointsPerTask = pointsError;
    if (goalError) newErrors.weeklyGoal = goalError;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Escenario 1 y 3: Creación exitosa (< 3 segundos)
    setIsCreating(true);

    setTimeout(() => {
      // Calcular fecha de inicio y fin de la semana actual
      const now = Date.now();
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Crear nueva clasificación
      const newRanking: WeeklyRanking = {
        id: `ranking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        groupId: groupId,
        pointsPerTask: parseInt(pointsPerTask, 10),
        weeklyGoal: parseInt(weeklyGoal, 10),
        startDate: startOfWeek.getTime(),
        endDate: endOfWeek.getTime(),
        active: true,
        createdAt: now,
      };

      // Guardar en localStorage
      const rankings: WeeklyRanking[] = JSON.parse(
        localStorage.getItem("weeklyRankings") || "[]"
      );
      rankings.push(newRanking);
      localStorage.setItem("weeklyRankings", JSON.stringify(rankings));

      // Actualizar estado
      setActiveRanking(newRanking);
      setIsCreating(false);
      setShowSuccess(true);

      // Limpiar formulario
      setPointsPerTask("");
      setWeeklyGoal("");

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    }, 1200); // Simular 1.2 segundos de procesamiento
  };

  return (
    <>
      {/* Mensaje de éxito */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Clasificación creada exitosamente</p>
            <p className="text-xs text-gray-600 mt-0.5">
              La clasificación semanal ha sido configurada correctamente
            </p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {/* Mensaje de advertencia - clasificación activa */}
      {showActiveWarning && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-orange-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Ya existe una clasificación activa</p>
            <p className="text-xs text-gray-600 mt-0.5">
              No se pueden crear múltiples clasificaciones semanales activas
            </p>
          </div>
          <button
            onClick={() => setShowActiveWarning(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      <Card className="shadow-sm border-purple-100">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-500" />
            Clasificación semanal
          </CardTitle>
          <CardDescription>
            Configura la clasificación semanal para incentivar la participación del grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Alerta de clasificación activa */}
          {activeRanking && (
            <Alert variant="default" className="border-blue-200 bg-blue-50 mb-5">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <span className="font-medium">Ya existe una clasificación semanal activa</span>
                <div className="text-sm text-blue-700 mt-1">
                  Puntos por tarea: <span className="font-medium">{activeRanking.pointsPerTask}</span> ·
                  Meta semanal: <span className="font-medium">{activeRanking.weeklyGoal} puntos</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Puntos por tarea completada */}
            <div className="space-y-2">
              <Label htmlFor="pointsPerTask">
                Puntos por tarea completada <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pointsPerTask"
                type="number"
                min="1"
                max="1000"
                value={pointsPerTask}
                onChange={(e) => {
                  setPointsPerTask(e.target.value);
                  if (errors.pointsPerTask) {
                    setErrors({ ...errors, pointsPerTask: undefined });
                  }
                }}
                placeholder="Ej: 10"
                className={errors.pointsPerTask ? "border-red-500 focus-visible:ring-red-200" : ""}
                disabled={isCreating || !!activeRanking}
              />
              {errors.pointsPerTask && (
                <p className="text-sm text-red-600 flex items-start gap-1.5">
                  <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-1.5"></span>
                  {errors.pointsPerTask}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Cantidad de puntos que se otorgarán por cada tarea completada
              </p>
            </div>

            {/* Meta semanal de puntos */}
            <div className="space-y-2">
              <Label htmlFor="weeklyGoal">
                Meta semanal de puntos <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weeklyGoal"
                type="number"
                min="1"
                max="10000"
                value={weeklyGoal}
                onChange={(e) => {
                  setWeeklyGoal(e.target.value);
                  if (errors.weeklyGoal) {
                    setErrors({ ...errors, weeklyGoal: undefined });
                  }
                }}
                placeholder="Ej: 100"
                className={errors.weeklyGoal ? "border-red-500 focus-visible:ring-red-200" : ""}
                disabled={isCreating || !!activeRanking}
              />
              {errors.weeklyGoal && (
                <p className="text-sm text-red-600 flex items-start gap-1.5">
                  <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-1.5"></span>
                  {errors.weeklyGoal}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Objetivo de puntos que los miembros deben alcanzar semanalmente
              </p>
            </div>

            {/* Botón de creación */}
            <div className="pt-4">
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto"
                disabled={isCreating || !!activeRanking}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando clasificación...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Crear clasificación semanal
                  </>
                )}
              </Button>
              {activeRanking && (
                <p className="text-xs text-gray-500 mt-2">
                  No se puede crear una nueva clasificación mientras exista una activa
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
