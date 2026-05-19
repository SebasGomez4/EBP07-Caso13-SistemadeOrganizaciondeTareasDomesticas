import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  ClipboardList,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  CircleDashed,
  UserPlus,
  Loader2,
  Trash2,
  Repeat,
  BellRing,
  Wifi,
  MoreVertical,
  CircleDot,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Task {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  deadline: string;
  frequency?: string;
  assignedTo?: string;
  priority?: "alta" | "media" | "baja";
  status: "pending" | "in_progress" | "completed";
  createdAt: number;
  completedAt?: number;
}

interface TasksListProps {
  groupId: string;
  refreshTrigger?: number;
  createTaskButton?: React.ReactNode;
  currentUserRole?: "Administrador" | "Coadministrador" | "Colaborador";
}

interface GroupMember {
  email: string;
  fullName: string;
}

interface CompletionAlert {
  id: string;
  groupId: string;
  taskId: string;
  taskName: string;
  completedBy: string;
  completedByName: string;
  completedAt: number;
  seenBy: string[];
}

interface AssignmentAlert {
  id: string;
  groupId: string;
  taskId: string;
  taskName: string;
  taskDescription?: string;
  assignedTo: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: number;
  seenBy: string[];
}

interface OverdueAlert {
  id: string;
  groupId: string;
  taskId: string;
  taskName: string;
  assignedTo: string;
  assignedToName: string;
  deadline: string;
  overdueAt: number;
  isDueSoon?: boolean;
  seenBy: string[];
}

function loadTasks(groupId: string): Task[] {
  const allTasks: Task[] = JSON.parse(localStorage.getItem("familyTasks") || "[]");
  return allTasks.filter((task) => task.groupId === groupId);
}

function getAssigneeName(email?: string): string {
  if (!email) return "Sin asignar";
  const users: Array<{ email: string; fullName: string }> = JSON.parse(
    localStorage.getItem("users") || "[]"
  );
  const user = users.find((u) => u.email === email);
  return user?.fullName || email;
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "in_progress":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "pending":
      return "bg-gray-50 text-gray-600 border-gray-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "completed":
      return "Completada";
    case "in_progress":
      return "En progreso";
    case "pending":
      return "Sin empezar";
    default:
      return "Sin empezar";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
    case "in_progress":
      return <CircleDot className="h-3.5 w-3.5 text-blue-600" />;
    case "pending":
      return <CircleDashed className="h-3.5 w-3.5 text-gray-600" />;
    default:
      return <CircleDashed className="h-3.5 w-3.5 text-gray-600" />;
  }
}

function getPriorityBadgeStyle(priority?: string) {
  switch (priority) {
    case "alta":
      return "bg-red-50 text-red-700 border-red-200";
    case "media":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "baja":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-50 text-gray-500 border-gray-200";
  }
}

function getPriorityText(priority?: string) {
  if (!priority) return "Sin prioridad";
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatDate(dateString: string): string {
  // Parsear manualmente para evitar problemas de UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFrequency(frequency?: string): string {
  if (!frequency || frequency === "ninguna") return "";
  const frequencies: Record<string, string> = {
    diaria: "Diaria",
    semanal: "Semanal",
    mensual: "Mensual",
  };
  return frequencies[frequency] || frequency;
}

// HU 4.1.2: Helpers de vencimiento
function isTaskDueSoon(task: Task): boolean {
  if (task.status === "completed") return false;
  if (!task.deadline || (task.frequency && task.frequency !== "ninguna")) return false;
  // Parsear manualmente para evitar problemas de UTC
  const [year, month, day] = task.deadline.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  deadline.setHours(23, 59, 59, 999);
  const hoursLeft = (deadline.getTime() - Date.now()) / 3600000;
  return hoursLeft >= 0 && hoursLeft <= 48;
}

function isTaskOverdue(task: Task): boolean {
  if (task.status === "completed") return false;
  if (!task.deadline || (task.frequency && task.frequency !== "ninguna")) return false;
  // Parsear manualmente para evitar problemas de UTC
  const [year, month, day] = task.deadline.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime() < Date.now();
}

// HU 4.1.4: Helpers
function getUserDisplayName(email: string): string {
  const users: Array<{ email: string; fullName: string }> = JSON.parse(
    localStorage.getItem("users") || "[]"
  );
  return users.find((u) => u.email === email)?.fullName || email;
}

function formatCompletedAt(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) +
    " · " +
    date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  );
}

function loadGroupMembers(groupId: string): GroupMember[] {
  const groupMembers: Record<string, string[]> = JSON.parse(
    localStorage.getItem("groupMembers") || "{}"
  );
  const memberEmails = groupMembers[groupId] || [];
  const users: Array<{ email: string; fullName: string }> = JSON.parse(
    localStorage.getItem("users") || "[]"
  );
  return memberEmails.map((email) => {
    const user = users.find((u) => u.email === email);
    return { email, fullName: user?.fullName || email };
  });
}

export function TasksList({ groupId, refreshTrigger, createTaskButton, currentUserRole }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successTaskName, setSuccessTaskName] = useState("");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccessMessage, setShowDeleteSuccessMessage] = useState(false);
  const [deletedTaskName, setDeletedTaskName] = useState("");

  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [showStatusSuccessMessage, setShowStatusSuccessMessage] = useState(false);
  const [statusSuccessTaskName, setStatusSuccessTaskName] = useState("");
  const [showRestrictedMessage, setShowRestrictedMessage] = useState(false);

  const [showReconnectNotice, setShowReconnectNotice] = useState(false);
  const [showColaboradorRestricted, setShowColaboradorRestricted] = useState(false);
  const [showNoReassignCompleted, setShowNoReassignCompleted] = useState(false);

  const isColaborador = currentUserRole === "Colaborador";

  const [recentActivity, setRecentActivity] = useState<CompletionAlert[]>([]);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [isActivityExpanded, setIsActivityExpanded] = useState(true);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);

  const INITIAL_TASKS_VISIBLE = 4;

  useEffect(() => {
    const session = localStorage.getItem("currentSession");
    let userEmail = "";
    if (session) {
      const sessionData = JSON.parse(session);
      userEmail = sessionData.user.email;
      setCurrentUserEmail(userEmail);
    }

    const checkAndShowAlerts = (loadedTasks: Task[], email: string) => {
      if (!email) return;

      // Persist overdue and due-soon alerts so NotificationBell can display them
      const overdueOnly = loadedTasks.filter(
        (t) => t.assignedTo === email && isTaskOverdue(t)
      );
      const dueSoonOnly = loadedTasks.filter(
        (t) => t.assignedTo === email && isTaskDueSoon(t) && !isTaskOverdue(t)
      );
      // IDs of tasks that are no longer overdue or due-soon (e.g. completed)
      const activeAlertTaskIds = new Set([
        ...overdueOnly.map((t) => t.id),
        ...dueSoonOnly.map((t) => t.id),
      ]);

      const existingOverdueAlerts: OverdueAlert[] = JSON.parse(
        localStorage.getItem("taskOverdueAlerts") || "[]"
      );

      // Promote "due soon" alerts to "overdue" when the deadline has now passed,
      // and drop alerts for tasks that are no longer relevant (completed, etc.)
      let updatedAlerts = existingOverdueAlerts
        .filter((a) => a.assignedTo !== email || activeAlertTaskIds.has(a.taskId))
        .map((a) => {
          if (a.isDueSoon && overdueOnly.some((t) => t.id === a.taskId)) {
            return { ...a, isDueSoon: false, overdueAt: Date.now(), seenBy: [] };
          }
          return a;
        });

      const updatedTaskIds = new Set(updatedAlerts.map((a) => a.taskId));

      const newOverdue = overdueOnly
        .filter((t) => !updatedTaskIds.has(t.id))
        .map((t): OverdueAlert => ({
          id: `oa-${t.id}`,
          groupId: t.groupId,
          taskId: t.id,
          taskName: t.name,
          assignedTo: email,
          assignedToName: getUserDisplayName(email),
          deadline: t.deadline,
          overdueAt: Date.now(),
          isDueSoon: false,
          seenBy: [],
        }));

      const newDueSoon = dueSoonOnly
        .filter((t) => !updatedTaskIds.has(t.id))
        .map((t): OverdueAlert => ({
          id: `ds-${t.id}`,
          groupId: t.groupId,
          taskId: t.id,
          taskName: t.name,
          assignedTo: email,
          assignedToName: getUserDisplayName(email),
          deadline: t.deadline,
          overdueAt: Date.now(),
          isDueSoon: true,
          seenBy: [],
        }));

      const finalAlerts = [...updatedAlerts, ...newOverdue, ...newDueSoon];
      localStorage.setItem("taskOverdueAlerts", JSON.stringify(finalAlerts));
    };

    const checkCompletionAlerts = (email: string) => {
      if (!email) return;
      const allAlerts: CompletionAlert[] = JSON.parse(
        localStorage.getItem("taskCompletionAlerts") || "[]"
      );

      // Política de expiración: 48 horas
      const EXPIRATION_TIME = 48 * 60 * 60 * 1000;
      const now = Date.now();

      // Filtrar actividades expiradas (mayores a 48 horas) y actualizar localStorage
      const validAlerts = allAlerts.filter((a) => now - a.completedAt < EXPIRATION_TIME);
      if (validAlerts.length !== allAlerts.length) {
        localStorage.setItem("taskCompletionAlerts", JSON.stringify(validAlerts));
      }

      const groupAlerts = validAlerts
        .filter((a) => a.groupId === groupId)
        .sort((a, b) => b.completedAt - a.completedAt);
      setRecentActivity(groupAlerts.slice(0, 10));

      // Contar actividades nuevas para el badge (sin mostrar toast)
      const newActivities = groupAlerts.filter(
        (a) => a.completedBy !== email && Date.now() - a.completedAt < 5 * 60 * 1000
      );
      setNewActivityCount(newActivities.length);
    };

    setLoading(true);
    const loadTimer = setTimeout(() => {
      const loadedTasks = loadTasks(groupId);
      setTasks(loadedTasks);
      setLoading(false);
      checkAndShowAlerts(loadedTasks, userEmail);
      checkCompletionAlerts(userEmail);
    }, 600);

    setGroupMembers(loadGroupMembers(groupId));

    const interval = setInterval(() => {
      const loadedTasks = loadTasks(groupId);
      setTasks(loadedTasks);
      checkAndShowAlerts(loadedTasks, userEmail);
    }, 3000);

    const alertInterval = setInterval(() => {
      checkCompletionAlerts(userEmail);
    }, 2000);

    const handleOnline = () => {
      setShowReconnectNotice(true);
      setTimeout(() => {
        const loadedTasks = loadTasks(groupId);
        setTasks(loadedTasks);
        checkAndShowAlerts(loadedTasks, userEmail);
        checkCompletionAlerts(userEmail);
        setShowReconnectNotice(false);
      }, 800);
    };

    window.addEventListener("online", handleOnline);

    return () => {
      clearTimeout(loadTimer);
      clearInterval(interval);
      clearInterval(alertInterval);
      window.removeEventListener("online", handleOnline);
    };
  }, [groupId, refreshTrigger]);

  const handleOpenAssignDialog = (task: Task) => {
    if (isColaborador) {
      setShowColaboradorRestricted(true);
      setTimeout(() => setShowColaboradorRestricted(false), 4000);
      return;
    }
    if (task.status === "completed" && (!task.frequency || task.frequency === "ninguna")) {
      setShowNoReassignCompleted(true);
      setTimeout(() => setShowNoReassignCompleted(false), 4000);
      return;
    }
    setSelectedTask(task);
    setSelectedMember(task.assignedTo || "");
    setAssignDialogOpen(true);
  };

  const handleAssignTask = () => {
    if (!selectedTask || !selectedMember) return;
    setIsAssigning(true);
    setTimeout(() => {
      const allTasks: Task[] = JSON.parse(localStorage.getItem("familyTasks") || "[]");
      const updatedTasks = allTasks.map((task) =>
        task.id === selectedTask.id ? { ...task, assignedTo: selectedMember } : task
      );
      localStorage.setItem("familyTasks", JSON.stringify(updatedTasks));

      // Create assignment notification so NotificationBell can display it
      const assignmentAlert: AssignmentAlert = {
        id: `aa-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        groupId,
        taskId: selectedTask.id,
        taskName: selectedTask.name,
        taskDescription: selectedTask.description,
        assignedTo: selectedMember,
        assignedBy: currentUserEmail,
        assignedByName: getUserDisplayName(currentUserEmail),
        assignedAt: Date.now(),
        seenBy: [currentUserEmail],
      };
      const allAssignmentAlerts: AssignmentAlert[] = JSON.parse(
        localStorage.getItem("taskAssignmentAlerts") || "[]"
      );
      allAssignmentAlerts.push(assignmentAlert);
      localStorage.setItem("taskAssignmentAlerts", JSON.stringify(allAssignmentAlerts));

      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id ? { ...task, assignedTo: selectedMember } : task
        )
      );
      setAssignDialogOpen(false);
      setIsAssigning(false);
      setSuccessTaskName(selectedTask.name);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 4000);
      setSelectedTask(null);
      setSelectedMember("");
    }, 1200);
  };

  const handleOpenDeleteDialog = (task: Task) => {
    if (isColaborador) {
      setShowColaboradorRestricted(true);
      setTimeout(() => setShowColaboradorRestricted(false), 4000);
      return;
    }
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTask = () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      const allTasks: Task[] = JSON.parse(localStorage.getItem("familyTasks") || "[]");
      const updatedTasks = allTasks.filter((task) => task.id !== taskToDelete.id);
      localStorage.setItem("familyTasks", JSON.stringify(updatedTasks));
      setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id));
      setDeleteDialogOpen(false);
      setIsDeleting(false);
      setDeletedTaskName(taskToDelete.name);
      setShowDeleteSuccessMessage(true);
      setTimeout(() => setShowDeleteSuccessMessage(false), 4000);
      setTaskToDelete(null);
    }, 1000);
  };

  const handleStatusChange = (task: Task, newStatus: string) => {
    if (task.assignedTo && task.assignedTo !== currentUserEmail) {
      setShowRestrictedMessage(true);
      setTimeout(() => setShowRestrictedMessage(false), 4000);
      return;
    }
    if (!task.assignedTo) {
      setShowRestrictedMessage(true);
      setTimeout(() => setShowRestrictedMessage(false), 4000);
      return;
    }
    setUpdatingTaskId(task.id);
    setTimeout(() => {
      const allTasks: Task[] = JSON.parse(localStorage.getItem("familyTasks") || "[]");
      const updatedTasks = allTasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: newStatus as Task["status"],
              completedAt: newStatus === "completed" ? Date.now() : undefined,
            }
          : t
      );
      localStorage.setItem("familyTasks", JSON.stringify(updatedTasks));
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: newStatus as Task["status"],
                completedAt: newStatus === "completed" ? Date.now() : undefined,
              }
            : t
        )
      );
      setUpdatingTaskId(null);
      setStatusSuccessTaskName(task.name);
      setShowStatusSuccessMessage(true);
      setTimeout(() => setShowStatusSuccessMessage(false), 4000);

      // Despachar evento para actualización inmediata de otros componentes
      window.dispatchEvent(new CustomEvent("taskStatusChanged", { detail: { taskId: task.id, status: newStatus } }));

      if (newStatus === "completed") {
        // Remove any overdue/due-soon alerts for this task
        const allOverdueAlerts: OverdueAlert[] = JSON.parse(
          localStorage.getItem("taskOverdueAlerts") || "[]"
        );
        localStorage.setItem(
          "taskOverdueAlerts",
          JSON.stringify(allOverdueAlerts.filter((a) => a.taskId !== task.id))
        );

        const completionAlert: CompletionAlert = {
          id: `ca-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          groupId,
          taskId: task.id,
          taskName: task.name,
          completedBy: currentUserEmail,
          completedByName: getUserDisplayName(currentUserEmail),
          completedAt: Date.now(),
          seenBy: [currentUserEmail],
        };
        const allAlerts: CompletionAlert[] = JSON.parse(
          localStorage.getItem("taskCompletionAlerts") || "[]"
        );

        // Política de expiración: 48 horas
        const EXPIRATION_TIME = 48 * 60 * 60 * 1000;
        const now = Date.now();
        const validAlerts = allAlerts.filter((a) => now - a.completedAt < EXPIRATION_TIME);

        validAlerts.push(completionAlert);

        // Limitar a 10 actividades por grupo para evitar crecimiento infinito
        const groupAlerts = validAlerts.filter((a) => a.groupId === groupId)
          .sort((a, b) => b.completedAt - a.completedAt)
          .slice(0, 10);
        const otherGroupAlerts = validAlerts.filter((a) => a.groupId !== groupId);
        const limitedAlerts = [...groupAlerts, ...otherGroupAlerts];

        localStorage.setItem("taskCompletionAlerts", JSON.stringify(limitedAlerts));
        setRecentActivity((prev) => [completionAlert, ...prev].slice(0, 10));
      }
    }, 800);
  };

  const myOverdueTasks = tasks.filter(
    (t) => t.assignedTo === currentUserEmail && isTaskOverdue(t)
  );
  const myDueSoonTasks = tasks.filter(
    (t) => t.assignedTo === currentUserEmail && isTaskDueSoon(t)
  );

  if (loading) {
    return (
      <Card className="border-purple-100/50 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="h-8 w-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <span className="text-sm">Cargando tareas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="border-purple-100/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-purple-600" />
            Tareas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botón crear tarea - siempre visible */}
          {createTaskButton && (
            <div className="pb-2">
              {createTaskButton}
            </div>
          )}

          {/* Estado vacío */}
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-gray-600 font-medium mb-1">No hay tareas registradas</p>
            <p className="text-sm text-gray-500">
              Crea tu primera tarea para empezar a organizar el hogar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Toasts - Solo confirmaciones de acciones del usuario */}
      {showReconnectNotice && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-blue-200 shadow-lg rounded-xl px-5 py-3 transition-all max-w-sm">
          <Wifi className="h-4 w-4 text-blue-500 shrink-0" />
          <p className="flex-1 text-sm text-gray-700">Conexión restaurada · Sincronizando alertas...</p>
          <button
            onClick={() => setShowReconnectNotice(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Tarea asignada exitosamente</p>
            <p className="text-xs text-gray-600 mt-0.5">La tarea "{successTaskName}" fue asignada correctamente</p>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {showDeleteSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Tarea eliminada exitosamente</p>
            <p className="text-xs text-gray-600 mt-0.5">La tarea "{deletedTaskName}" fue eliminada correctamente</p>
          </div>
          <button
            onClick={() => setShowDeleteSuccessMessage(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {showStatusSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Estado actualizado exitosamente</p>
            <p className="text-xs text-gray-600 mt-0.5">El estado de "{statusSuccessTaskName}" se actualizó correctamente</p>
          </div>
          <button
            onClick={() => setShowStatusSuccessMessage(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {showRestrictedMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-orange-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Acción no permitida</p>
            <p className="text-xs text-gray-600 mt-0.5">Solo el responsable puede actualizar esta tarea</p>
          </div>
          <button
            onClick={() => setShowRestrictedMessage(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {showColaboradorRestricted && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-orange-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Acción no permitida</p>
            <p className="text-xs text-gray-600 mt-0.5">Los colaboradores no pueden realizar esta acción</p>
          </div>
          <button
            onClick={() => setShowColaboradorRestricted(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {showNoReassignCompleted && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-orange-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Reasignación no permitida</p>
            <p className="text-xs text-gray-600 mt-0.5">Solo las tareas recurrentes pueden reasignarse después de completadas</p>
          </div>
          <button
            onClick={() => setShowNoReassignCompleted(false)}
            className="shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-purple-600" />
              </div>
              Asignar tarea
            </DialogTitle>
            <DialogDescription>Selecciona el miembro responsable</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-5 mt-4">
              <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Tarea a asignar</p>
                <p className="font-medium text-gray-900">{selectedTask.name}</p>
                {selectedTask.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{selectedTask.description}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Asignar a <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedMember}
                  onValueChange={setSelectedMember}
                  disabled={isAssigning}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona un miembro del grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupMembers.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-gray-500">
                        No hay miembros disponibles en el grupo
                      </div>
                    ) : (
                      groupMembers.map((member) => (
                        <SelectItem key={member.email} value={member.email}>
                          {member.fullName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={isAssigning}>
                  Cancelar
                </Button>
                <Button onClick={handleAssignTask} disabled={!selectedMember || isAssigning} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Asignar tarea
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              Eliminar tarea
            </DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          {taskToDelete && (
            <div className="space-y-5 mt-4">
              <div className="bg-red-50/50 border border-red-100 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">¿Desea eliminar esta tarea?</p>
                <p className="font-medium text-gray-900">{taskToDelete.name}</p>
                {taskToDelete.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{taskToDelete.description}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                  Cancelar
                </Button>
                <Button onClick={handleDeleteTask} disabled={isDeleting} variant="destructive" className="bg-red-600 hover:bg-red-700">
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar tarea
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lista principal */}
      <Card className="border-purple-100/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-purple-600" />
                Tareas
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {tasks.length} {tasks.length === 1 ? "tarea" : "tareas"} en total
              </CardDescription>
            </div>
            {(myOverdueTasks.length > 0 || myDueSoonTasks.length > 0 || newActivityCount > 0) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {myOverdueTasks.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    <AlertCircle className="h-3 w-3" />
                    {myOverdueTasks.length} vencida{myOverdueTasks.length !== 1 ? "s" : ""}
                  </span>
                )}
                {myDueSoonTasks.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <BellRing className="h-3 w-3" />
                    {myDueSoonTasks.length} próxima{myDueSoonTasks.length !== 1 ? "s" : ""}
                  </span>
                )}
                {newActivityCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle2 className="h-3 w-3" />
                    {newActivityCount} completada{newActivityCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Botón crear tarea */}
          {createTaskButton && (
            <div className="pb-2">
              {createTaskButton}
            </div>
          )}

          {/* Panel de actividad */}
          {recentActivity.length > 0 && (
            <div className="border border-green-100 rounded-lg overflow-hidden bg-gradient-to-br from-green-50/50 to-emerald-50/30">
              <button
                onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 bg-green-50/80 border-b border-green-100 hover:bg-green-100/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-medium text-green-800">
                    Actividad reciente ({recentActivity.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {newActivityCount > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-green-200 text-green-800">
                      {newActivityCount}
                    </span>
                  )}
                  {isActivityExpanded ? (
                    <ChevronUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </button>
              {isActivityExpanded && (
                <div className="divide-y divide-green-50 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-green-50">
                  {recentActivity.map((alert) => {
                    const isNew = Date.now() - alert.completedAt < 5 * 60 * 1000;
                    return (
                      <div key={alert.id} className="flex items-start gap-2.5 px-3 py-2 bg-white/50 hover:bg-white/80 transition-colors">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isNew ? "bg-green-500" : "bg-gray-300"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700">
                            <span className="font-medium text-gray-900">{alert.completedByName}</span> completó{" "}
                            <span className="font-medium text-gray-900">"{alert.taskName}"</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatCompletedAt(alert.completedAt)}</p>
                        </div>
                        {isNew && (
                          <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            Nueva
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Cards de tareas compactas y modernas */}
          <div className="space-y-2.5">
            {(isTasksExpanded ? tasks : tasks.slice(0, INITIAL_TASKS_VISIBLE)).map((task) => {
              const overdue = isTaskOverdue(task);
              const dueSoon = isTaskDueSoon(task);
              const isMyTask = task.assignedTo === currentUserEmail;
              const isUpdating = updatingTaskId === task.id;

              const cardBg = overdue && isMyTask
                ? "bg-red-50/30 border-red-200"
                : dueSoon && isMyTask
                ? "bg-yellow-50/30 border-yellow-200"
                : "bg-white border-gray-100";

              return (
                <div
                  key={task.id}
                  className={`group relative p-3 sm:p-4 rounded-lg border transition-all hover:shadow-sm ${cardBg}`}
                >
                  {/* Header: título + estado */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{task.name}</h3>
                        {overdue && isMyTask && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200 shrink-0">
                            <AlertCircle className="h-3 w-3" />
                            Vencida
                          </span>
                        )}
                        {dueSoon && !overdue && isMyTask && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200 shrink-0">
                            <BellRing className="h-3 w-3" />
                            Vence pronto
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusBadgeStyle(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {getStatusText(task.status)}
                      </span>
                      {!isColaborador && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!(task.status === "completed" && (!task.frequency || task.frequency === "ninguna")) && (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenAssignDialog(task)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  {task.assignedTo ? "Reasignar" : "Asignar"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleOpenDeleteDialog(task)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* Cambio de estado */}
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <Select
                      value={task.status}
                      onValueChange={(newStatus) => handleStatusChange(task, newStatus)}
                      disabled={isUpdating || !task.assignedTo || task.assignedTo !== currentUserEmail}
                    >
                      <SelectTrigger className={`h-8 text-xs ${!task.assignedTo || task.assignedTo !== currentUserEmail ? "cursor-not-allowed opacity-60" : ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Sin empezar</SelectItem>
                        <SelectItem value="in_progress">En progreso</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                      </SelectContent>
                    </Select>
                    {(!task.assignedTo || task.assignedTo !== currentUserEmail) && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Solo el responsable puede actualizar
                      </p>
                    )}
                    {isUpdating && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Actualizando...
                      </p>
                    )}
                  </div>

                  {/* Grid de metadatos */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className={`truncate ${task.assignedTo ? "text-gray-700" : "text-gray-400 italic"}`}>
                        {getAssigneeName(task.assignedTo)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getPriorityBadgeStyle(task.priority)}`}>
                        {getPriorityText(task.priority)}
                      </span>
                    </div>
                    {task.frequency && task.frequency !== "ninguna" ? (
                      <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                        <Repeat className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-700 truncate">{formatFrequency(task.frequency)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                        <Calendar className={`h-3.5 w-3.5 shrink-0 ${overdue && isMyTask ? "text-red-400" : dueSoon && isMyTask ? "text-yellow-500" : "text-gray-400"}`} />
                        <span className={`truncate ${overdue && isMyTask ? "text-red-700 font-medium" : dueSoon && isMyTask ? "text-yellow-700 font-medium" : "text-gray-700"}`}>
                          {task.deadline ? formatDate(task.deadline) : "No definida"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón Ver más / Ver menos */}
          {tasks.length > INITIAL_TASKS_VISIBLE && (
            <div className="flex justify-center pt-3">
              <button
                onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                {isTasksExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ver menos tareas
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Ver más tareas ({tasks.length - INITIAL_TASKS_VISIBLE} ocultas)
                  </>
                )}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
