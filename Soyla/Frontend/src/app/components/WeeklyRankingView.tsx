import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Crown, Medal, Star, Trophy } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { ApiError, getWeeklyRanking, type WeeklyRanking } from "../lib/api";

interface WeeklyRankingViewProps {
  groupId: string;
  currentUserEmail: string;
  refreshTrigger?: number;
}

function initials(name: string) {
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join("");
}

function positionIcon(position: number) {
  if (position === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (position === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (position === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="text-xs text-gray-500 font-medium w-4 text-center">{position}</span>;
}

export function WeeklyRankingView({ groupId, currentUserEmail, refreshTrigger }: WeeklyRankingViewProps) {
  const [ranking, setRanking] = useState<WeeklyRanking | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRanking = async () => {
    setLoading(true);
    try {
      setRanking(await getWeeklyRanking(groupId));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setRanking(null);
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRanking();
    const interval = window.setInterval(() => void loadRanking(), 2000);
    return () => window.clearInterval(interval);
  }, [groupId, refreshTrigger]);

  if (loading) {
    return (
      <Card className="shadow-sm border-purple-100/50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!ranking) {
    return (
      <Card className="shadow-sm border-purple-100/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-purple-500" />Clasificacion semanal</CardTitle>
          <CardDescription>Progreso y ranking del grupo familiar</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <AlertCircle className="h-8 w-8 text-purple-300" />
          <p className="text-sm text-gray-500">Aun no hay una clasificacion semanal activa.</p>
        </CardContent>
      </Card>
    );
  }

  const myScore = ranking.members.find((member) => member.email === currentUserEmail);
  const progress = Math.min(100, Math.round(((myScore?.points ?? 0) / ranking.weeklyGoal) * 100));
  const winner = ranking.winnerEmail ? ranking.members.find((member) => member.email === ranking.winnerEmail) : null;

  return (
    <Card className="shadow-sm border-purple-100/50 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-purple-500" />
          {ranking.active ? "Clasificacion semanal" : "Clasificacion finalizada"}
        </CardTitle>
        <CardDescription>
          Meta: {ranking.weeklyGoal} pts · {ranking.pointsPerTask} pt/tarea
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!ranking.active && winner && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Ganador semanal: {winner.fullName}</p>
            <p className="text-xs text-gray-600">{winner.points} puntos</p>
          </div>
        )}

        {myScore && (
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-900">Mi progreso</span>
              <Badge className="bg-white border-purple-200 text-purple-700">#{myScore.position} · {myScore.points} pts</Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-purple-700">{progress}% de la meta semanal</p>
          </div>
        )}

        <div className="space-y-2">
          {ranking.members.map((member) => {
            const memberProgress = Math.min(100, Math.round((member.points / ranking.weeklyGoal) * 100));
            return (
              <div key={member.email} className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-white border-gray-100">
                <div className="flex items-center justify-center w-5 shrink-0">{positionIcon(member.position)}</div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-semibold">{initials(member.fullName)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.fullName}{member.email === currentUserEmail && <span className="ml-1 text-xs text-purple-600">(tu)</span>}
                  </p>
                  <Progress value={memberProgress} className="h-1 mt-1" />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-800">{member.points}</p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              </div>
            );
          })}
        </div>

        {myScore && (
          <div className="border-t border-purple-100 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Mis puntos</p>
            {myScore.history.length === 0 ? (
              <p className="text-xs text-gray-400">Aun no has completado tareas en esta clasificacion.</p>
            ) : (
              <div className="space-y-2">
                {myScore.history.map((task) => (
                  <div key={task.taskId} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="flex-1 truncate">{task.taskName}</span>
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">+{task.points}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
