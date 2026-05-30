import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Trophy,
  Medal,
  Star,
  CheckCircle2,
  Clock,
  Crown,
  ListChecks,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

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

interface Task {
  id: string;
  groupId: string;
  name: string;
  assignedTo?: string;
  status: "pending" | "in_progress" | "completed";
  createdAt: number;
  completedAt?: number;
  priority?: "alta" | "media" | "baja";
}

interface MemberScore {
  email: string;
  fullName: string;
  points: number;
  completedTasks: Task[];
  position: number;
}

interface WeeklyRankingViewProps {
  groupId: string;
  currentUserEmail: string;
  refreshTrigger?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getUserName(email: string): string {
  const users: Array<{ email: string; fullName: string }> = JSON.parse(
    localStorage.getItem("users") || "[]"
  );
  return users.find((u) => u.email === email)?.fullName || email;
}

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function getPositionIcon(position: number) {
  if (position === 1)
    return <Crown className="h-4 w-4 text-yellow-500" aria-label="1er lugar" />;
  if (position === 2)
    return <Medal className="h-4 w-4 text-gray-400" aria-label="2do lugar" />;
  if (position === 3)
    return <Medal className="h-4 w-4 text-amber-600" aria-label="3er lugar" />;
  return (
    <span className="text-xs text-gray-500 font-medium w-4 text-center">
      {position}
    </span>
  );
}

function getPositionBg(position: number): string {
  if (position === 1) return "bg-yellow-50/50 border-yellow-200/50";
  if (position === 2) return "bg-gray-50/50 border-gray-200/50";
  if (position === 3) return "bg-amber-50/50 border-amber-200/50";
  return "bg-white border-gray-100";
}

function getAvatarGradient(position: number): string {
  if (position === 1) return "from-yellow-400 to-orange-400";
  if (position === 2) return "from-gray-400 to-gray-500";
  if (position === 3) return "from-amber-500 to-amber-600";
  return "from-purple-500 to-blue-500";
}

function daysRemaining(endDate: number): number {
  return Math.max(0, Math.ceil((endDate - Date.now()) / 86400000));
}

// ── Main component ─────────────────────────────────────────────────────────

export function WeeklyRankingView({
  groupId,
  currentUserEmail,
  refreshTrigger,
}: WeeklyRankingViewProps) {
  const [ranking, setRanking] = useState<WeeklyRanking | null>(null);
  const [scores, setScores] = useState<MemberScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [winner, setWinner] = useState<MemberScore | null>(null);
  const [activeTab, setActiveTab] = useState<"ranking" | "history">("ranking");
  const [highlightedMember, setHighlightedMember] = useState<string | null>(null);

  // ── Load and compute ranking data ────────────────────────────────────────

  const loadRankingData = useCallback(() => {
    // 1. Find active ranking, or fall back to the most recent finished one
    const allRankings: WeeklyRanking[] = JSON.parse(
      localStorage.getItem("weeklyRankings") || "[]"
    );
    const groupRankings = allRankings.filter((r) => r.groupId === groupId);
    const active = groupRankings.find((r) => r.active);

    // Use active ranking if present, otherwise use the latest finished one
    const current =
      active ??
      groupRankings
        .filter((r) => !r.active)
        .sort((a, b) => b.createdAt - a.createdAt)[0] ??
      null;

    if (!current) {
      setRanking(null);
      setScores([]);
      setIsLoading(false);
      setIsFinished(false);
      setWinner(null);
      return;
    }

    setRanking(current);

    // 2. Get all group members
    const membersMap: Record<string, string[]> = JSON.parse(
      localStorage.getItem("groupMembers") || "{}"
    );
    const memberEmails: string[] = membersMap[groupId] || [];

    // 3. Filter completed tasks within ranking period (regardless of when they were created)
    const allTasks: Task[] = JSON.parse(
      localStorage.getItem("familyTasks") || "[]"
    );
    const relevantTasks = allTasks.filter(
      (t) =>
        t.groupId === groupId &&
        t.status === "completed" &&
        t.completedAt !== undefined &&
        t.completedAt >= current.createdAt &&
        t.completedAt <= current.endDate
    );

    // 4. Compute scores per member
    const computedScores: MemberScore[] = memberEmails.map((email) => {
      const memberTasks = relevantTasks.filter((t) => t.assignedTo === email);
      return {
        email,
        fullName: getUserName(email),
        points: memberTasks.length * current.pointsPerTask,
        completedTasks: memberTasks,
        position: 0,
      };
    });

    // Sort descending by points, then alphabetically
    computedScores.sort((a, b) =>
      b.points !== a.points
        ? b.points - a.points
        : a.fullName.localeCompare(b.fullName)
    );

    // Assign positions (ties get same position)
    let pos = 1;
    for (let i = 0; i < computedScores.length; i++) {
      if (i > 0 && computedScores[i].points === computedScores[i - 1].points) {
        computedScores[i].position = computedScores[i - 1].position;
      } else {
        computedScores[i].position = pos;
      }
      pos++;
    }

    // Detectar si alguien aumentó puntos para el highlight
    setScores((prevScores) => {
      if (prevScores.length > 0) {
        computedScores.forEach(newScore => {
          const oldScore = prevScores.find(s => s.email === newScore.email);
          if (oldScore && newScore.points > oldScore.points) {
            setHighlightedMember(newScore.email);
            setTimeout(() => setHighlightedMember(null), 3000);
          }
        });
      }
      return computedScores;
    });

    // 5. Check finalization conditions (Escenario 4)
    // A ranking is finished if it's already inactive OR conditions are met
    const now = Date.now();
    const deadlineReached = now > current.endDate;
    const goalReached = computedScores.some((s) => s.points >= current.weeklyGoal);
    const finished = !current.active || deadlineReached || goalReached;

    // Mark as finished in localStorage only if it was still active
    if (finished && current.active) {
      const updated = allRankings.map((r) =>
        r.id === current.id ? { ...r, active: false } : r
      );
      localStorage.setItem("weeklyRankings", JSON.stringify(updated));

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent("rankingFinalized", { detail: { groupId } }));
    }

    setIsFinished(finished);
    setWinner(computedScores[0]?.points > 0 ? computedScores[0] : null);
    setIsLoading(false);
  }, [groupId]);

  // Initial load + periodic refresh (Escenario 5: < 2s)
  useEffect(() => {
    setIsLoading(true);
    loadRankingData();
  }, [loadRankingData, refreshTrigger]);

  useEffect(() => {
    const handleTaskChange = () => {
      loadRankingData();
    };

    window.addEventListener("taskStatusChanged", handleTaskChange);
    window.addEventListener("taskCreated", loadRankingData);
    
    return () => {
      window.removeEventListener("taskStatusChanged", handleTaskChange);
      window.removeEventListener("taskCreated", loadRankingData);
    };
  }, [loadRankingData]);

  useEffect(() => {
    const interval = setInterval(loadRankingData, 1800);
    return () => clearInterval(interval);
  }, [loadRankingData]);

  // ── Current user score ────────────────────────────────────────────────────

  const myScore = scores.find((s) => s.email === currentUserEmail);
  const progressPercent = ranking
    ? Math.min(100, Math.round(((myScore?.points ?? 0) / ranking.weeklyGoal) * 100))
    : 0;

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className="shadow-sm border-purple-100/50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="h-8 w-8 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
            <span className="text-sm">Cargando clasificación...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── No active ranking ─────────────────────────────────────────────────────

  if (!ranking) {
    return (
      <Card className="shadow-sm border-purple-100/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <span>Clasificación semanal</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Progreso y ranking del grupo familiar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8 text-purple-300" />
            </div>
            <p className="text-gray-500 text-sm max-w-xs">
              Aún no hay una clasificación semanal activa para este grupo.
            </p>
            <p className="text-gray-400 text-xs max-w-xs">
              El administrador puede crear una desde la sección de configuración.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Finished state ────────────────────────────────────────────────────────

  if (isFinished) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)]" />
        <div className="relative">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center shadow-sm">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <span>Clasificación finalizada</span>
            </CardTitle>
            <CardDescription className="text-xs text-yellow-700">
              La semana ha concluido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Winner announcement */}
            {winner ? (
              <div className="flex flex-col items-center text-center gap-4 py-3 px-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <p className="text-xs text-yellow-700 uppercase tracking-wide font-medium">
                    Ganador semanal
                  </p>
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-300/30 blur-xl rounded-full" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg ring-2 ring-yellow-300/50">
                    <span className="text-white text-2xl font-bold">
                      {getInitials(winner.fullName)}
                    </span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {winner.fullName}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge className="bg-yellow-500 text-white border-0 shadow-sm">
                      {winner.points} puntos
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {winner.completedTasks.length} tarea{winner.completedTasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Trophies */}
                <div className="flex items-center gap-2 text-yellow-500">
                  <Trophy className="h-5 w-5 opacity-60" />
                  <Trophy className="h-7 w-7" />
                  <Trophy className="h-5 w-5 opacity-60" />
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nadie acumuló puntos esta semana.
              </div>
            )}

            {/* Final ranking */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium px-1">
                Resultado final
              </p>
              {scores.map((member) => (
                <div
                  key={member.email}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border backdrop-blur-sm transition-all ${
                    member.position <= 3
                      ? getPositionBg(member.position)
                      : "bg-white/80 border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-center w-5 shrink-0">
                    {getPositionIcon(member.position)}
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(member.position)} flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <span className="text-white text-xs font-semibold">
                      {getInitials(member.fullName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.fullName}
                      {member.email === currentUserEmail && (
                        <span className="ml-1.5 text-xs text-purple-600 font-normal">
                          (tú)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.completedTasks.length} tarea{member.completedTasks.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 shrink-0">
                    {member.points} pts
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-yellow-700/70 bg-yellow-100/50 rounded-lg py-2 px-3">
              Los puntos ya no se acumulan. El administrador puede crear una nueva clasificación.
            </p>
          </CardContent>
        </div>
      </Card>
    );
  }

  // ── Active ranking ────────────────────────────────────────────────────────

  const days = daysRemaining(ranking.endDate);

  return (
    <Card className="shadow-sm border-purple-100/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <span>Clasificación semanal</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 text-purple-500" />
                Meta: <span className="font-medium text-gray-700">{ranking.weeklyGoal} pts</span>
              </span>
              <span className="text-gray-400">·</span>
              <span>{ranking.pointsPerTask} pt/tarea</span>
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-purple-200 bg-purple-50 text-purple-700 gap-1"
          >
            <Clock className="h-3 w-3" />
            {days === 0
              ? "Último día"
              : `${days} día${days !== 1 ? "s" : ""}`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── My progress ── */}
        {myScore && (
          <div className={`relative bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-3.5 space-y-3 overflow-hidden transition-all duration-500 ${highlightedMember === currentUserEmail ? 'ring-2 ring-purple-400 shadow-md scale-[1.01]' : ''}`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/20 rounded-full -mr-12 -mt-12 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Star className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-purple-900">
                  Mi progreso
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white border-purple-200 text-purple-700 shadow-sm">
                  #{myScore.position}°
                </Badge>
                <span className="text-sm font-bold text-purple-700">
                  {myScore.points} <span className="text-xs font-normal text-purple-600">/ {ranking.weeklyGoal}</span>
                </span>
              </div>
            </div>
            <div className="relative space-y-1.5">
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-600">
                  {myScore.completedTasks.length} tarea{myScore.completedTasks.length !== 1 ? "s" : ""}
                </span>
                <span className="font-medium text-purple-700">{progressPercent}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Tabs: Ranking / History ── */}
        <div className="flex gap-1 bg-gray-50 rounded-lg p-0.5 border border-gray-100">
          <button
            onClick={() => setActiveTab("ranking")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 px-3 rounded-md transition-all font-medium ${
              activeTab === "ranking"
                ? "bg-white shadow-sm text-purple-700 border border-purple-100"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Ranking
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 px-3 rounded-md transition-all font-medium ${
              activeTab === "history"
                ? "bg-white shadow-sm text-purple-700 border border-purple-100"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ListChecks className="h-3.5 w-3.5" />
            Mis puntos
          </button>
        </div>

        {/* ── Ranking tab ── */}
        {activeTab === "ranking" && (
          <div className="space-y-3">
            {scores.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center gap-2 text-gray-400">
                <AlertCircle className="h-8 w-8 text-gray-200" />
                <p className="text-sm">No hay miembros en este grupo aún.</p>
              </div>
            ) : (
              <>
                {/* Top 3 podium (highlighted) */}
                {scores.slice(0, 3).length > 1 && (
                  <div className="relative bg-gradient-to-b from-purple-50/50 to-transparent rounded-xl p-4 mb-2">
                    <div className="grid grid-cols-3 gap-2">
                      {/* 2nd place */}
                      {scores[1] && (
                        <div className="flex flex-col items-center gap-2 pt-6">
                          <div className="w-11 h-11 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-bold">
                              {getInitials(scores[1].fullName)}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-gray-700 text-center truncate w-full px-1">
                            {scores[1].fullName.split(" ")[0]}
                          </p>
                          <Badge variant="outline" className="text-xs border-gray-300 bg-white text-gray-600">
                            {scores[1].points}
                          </Badge>
                          <div className="w-full h-12 bg-gradient-to-t from-gray-100 to-gray-50 border border-gray-200 rounded-t-lg flex items-end justify-center pb-2">
                            <Medal className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      )}
                      {/* 1st place (center, taller) */}
                      {scores[0] && (
                        <div className="flex flex-col items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <div className="relative">
                            <div className="absolute inset-0 bg-yellow-300/30 blur-lg rounded-full" />
                            <div className="relative w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg ring-2 ring-yellow-300/50">
                              <span className="text-white font-bold">
                                {getInitials(scores[0].fullName)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-gray-800 text-center truncate w-full px-1">
                            {scores[0].fullName.split(" ")[0]}
                          </p>
                          <Badge className="text-xs bg-yellow-500 text-white border-0 shadow-sm">
                            {scores[0].points}
                          </Badge>
                          <div className="w-full h-20 bg-gradient-to-t from-yellow-100 to-yellow-50 border border-yellow-200 rounded-t-lg flex items-end justify-center pb-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          </div>
                        </div>
                      )}
                      {/* 3rd place */}
                      {scores[2] && (
                        <div className="flex flex-col items-center gap-2 pt-10">
                          <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-sm font-bold">
                              {getInitials(scores[2].fullName)}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-amber-800 text-center truncate w-full px-1">
                            {scores[2].fullName.split(" ")[0]}
                          </p>
                          <Badge variant="outline" className="text-xs border-amber-300 bg-white text-amber-700">
                            {scores[2].points}
                          </Badge>
                          <div className="w-full h-8 bg-gradient-to-t from-amber-100 to-amber-50 border border-amber-200 rounded-t-lg flex items-end justify-center pb-1">
                            <Medal className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Full list */}
                <div className="space-y-2">
                  {scores.map((member) => {
                    const memberProgress = Math.min(
                      100,
                      Math.round((member.points / ranking.weeklyGoal) * 100)
                    );
                    const isMe = member.email === currentUserEmail;
                    const isHighlighted = highlightedMember === member.email;
                    
                    return (
                      <div
                        key={member.email}
                        className={`group flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-500 ${
                          isHighlighted 
                            ? "bg-purple-100 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-[1.02] z-10" 
                            : isMe
                              ? "bg-purple-50/50 border-purple-200/50 hover:bg-purple-50"
                              : "bg-white border-gray-100 hover:border-purple-200/50 hover:bg-purple-50/30"
                        }`}
                      >
                        <div className="flex items-center justify-center w-5 shrink-0">
                          {getPositionIcon(member.position)}
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                            isMe
                              ? "from-purple-600 to-blue-600"
                              : getAvatarGradient(member.position)
                          } flex items-center justify-center shrink-0 shadow-sm`}
                        >
                          <span className="text-white text-xs font-semibold">
                            {getInitials(member.fullName)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.fullName}
                            </p>
                            {isMe && (
                              <span className="text-xs text-purple-600 shrink-0">
                                (tú)
                              </span>
                            )}
                            {member.position === 1 && member.points > 0 && (
                              <Star className="h-3 w-3 text-yellow-500 shrink-0 fill-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={memberProgress} className="h-1 flex-1" />
                            <span className="text-xs text-gray-400 shrink-0 w-8 text-right">
                              {memberProgress}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-800">
                            {member.points}
                          </p>
                          <p className="text-xs text-gray-400">pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === "history" && (
          <div className="space-y-2.5">
            {!myScore || myScore.completedTasks.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center gap-2 text-gray-400">
                <CheckCircle2 className="h-8 w-8 text-gray-200" />
                <p className="text-sm">
                  Aún no has completado tareas en esta clasificación.
                </p>
                <p className="text-xs text-gray-400">
                  Completa tareas asignadas a ti para ganar puntos.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-xs text-gray-500">Tareas completadas</span>
                  <Badge className="bg-green-500 text-white border-0 shadow-sm text-xs">
                    +{myScore.points} pts
                  </Badge>
                </div>
                {myScore.completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 p-2.5 bg-white border border-gray-100 rounded-lg hover:border-green-200 hover:bg-green-50/30 transition-all"
                  >
                    <div className="w-7 h-7 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {task.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(task.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-green-200 bg-green-50 text-green-700 text-xs">
                      +{ranking.pointsPerTask}
                    </Badge>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
