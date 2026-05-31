import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Trophy } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ApiError, createWeeklyRanking, getWeeklyRanking, type WeeklyRanking } from "../lib/api";

interface WeeklyRankingFormProps {
  groupId: string;
  currentUserRole: "Administrador" | "Coadministrador" | "Colaborador";
  currentUserEmail: string;
  onRankingCreated?: () => void;
}

export function WeeklyRankingForm({ groupId, currentUserRole, currentUserEmail, onRankingCreated }: WeeklyRankingFormProps) {
  const [pointsPerTask, setPointsPerTask] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [activeRanking, setActiveRanking] = useState<WeeklyRanking | null>(null);
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadActiveRanking = async () => {
    try {
      const loaded = await getWeeklyRanking(groupId);
      setActiveRanking(loaded.active ? loaded : null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setActiveRanking(null);
      }
    }
  };

  useEffect(() => {
    void loadActiveRanking();
  }, [groupId]);

  if (currentUserRole !== "Administrador") return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    const points = Number(pointsPerTask);
    const goal = Number(weeklyGoal);
    if (!Number.isFinite(points) || points <= 0 || !Number.isFinite(goal) || goal <= 0) {
      setMessage("Los puntos por tarea y la meta semanal deben ser mayores a cero.");
      return;
    }

    setIsCreating(true);
    try {
      const created = await createWeeklyRanking(groupId, {
        pointsPerTask: points,
        weeklyGoal: goal,
        requestedByEmail: currentUserEmail,
      });
      setActiveRanking(created);
      setPointsPerTask("");
      setWeeklyGoal("");
      setMessage("Clasificacion creada exitosamente.");
      onRankingCreated?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la clasificacion.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="shadow-sm border-purple-100">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-purple-500" />
          Crear clasificacion semanal
        </CardTitle>
        <CardDescription>Configura puntos por tarea y meta semanal del grupo.</CardDescription>
      </CardHeader>
      <CardContent>
        {activeRanking && (
          <Alert className="border-blue-200 bg-blue-50 mb-5">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Ya existe una clasificacion activa: {activeRanking.pointsPerTask} pt/tarea · meta {activeRanking.weeklyGoal} pts.
            </AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert className="mb-5">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pointsPerTask">Puntos por tarea completada</Label>
            <Input id="pointsPerTask" type="number" min="1" value={pointsPerTask} onChange={(event) => setPointsPerTask(event.target.value)} disabled={isCreating || !!activeRanking} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weeklyGoal">Meta semanal de puntos</Label>
            <Input id="weeklyGoal" type="number" min="1" value={weeklyGoal} onChange={(event) => setWeeklyGoal(event.target.value)} disabled={isCreating || !!activeRanking} />
          </div>
          <Button type="submit" disabled={isCreating || !!activeRanking} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trophy className="h-4 w-4 mr-2" />}
            Crear clasificacion semanal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
