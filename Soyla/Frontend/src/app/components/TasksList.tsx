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
import {
  assignTask,
  deleteTask,
  listGroupMembers,
  listTasks,
  updateTaskStatus,
  type GroupMember,
  type Task,
} from "../lib/api";

interface TasksListProps {
  groupId: string;
  refreshTrigger?: number;
  createTaskButton?: React.ReactNode;
  currentUserRole?: "Administrador" | "Coadministrador" | "Colaborador";
  currentUserEmail?: string;
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-50 text-green-700 border-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
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
    default:
      return "Sin empezar";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-600" />;
    default:
      return <CircleDashed className="h-3.5 w-3.5 text-gray-600" />;
  }
}

function getPriorityBadgeStyle(priority?: string | null) {
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

function getPriorityText(priority?: string | null) {
  if (!priority) return "Sin prioridad";
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "No definida";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFrequency(frequency?: string) {
  if (!frequency || frequency === "ninguna") return "";
  return {
    diaria: "Diaria",
    semanal: "Semanal",
    mensual: "Mensual",
  }[frequency] || frequency;
}

export function TasksList({ groupId, refreshTrigger, createTaskButton, currentUserRole, currentUserEmail }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successTaskName, setSuccessTaskName] = useState("");
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

  const [isTasksExpanded, setIsTasksExpanded] = useState(false);

  const INITIAL_TASKS_VISIBLE = 4;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [loadedTasks, loadedMembers] = await Promise.all([
        listTasks(groupId),
        listGroupMembers(groupId),
      ]);
      setTasks(loadedTasks);
      setGroupMembers(loadedMembers);
      setLoading(false);
    };

    void loadData();

    const interval = window.setInterval(() => {
      void listTasks(groupId).then(setTasks);
    }, 3000);

    return () => window.clearInterval(interval);
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
    setSelectedMember(task.assignedToEmail || "");
    setAssignDialogOpen(true);
  };

  const handleAssignTask = async () => {
    if (!selectedTask || !selectedMember) return;
    setIsAssigning(true);

    try {
      const updatedTask = await assignTask(selectedTask.id, {
        assignedToEmail: selectedMember,
      });

      setTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
      setAssignDialogOpen(false);
      setSuccessTaskName(selectedTask.name);
      setShowSuccessMessage(true);
      window.setTimeout(() => setShowSuccessMessage(false), 4000);
      setSelectedTask(null);
      setSelectedMember("");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);

    try {
      await deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id));
      setDeletedTaskName(taskToDelete.name);
      setShowDeleteSuccessMessage(true);
      window.setTimeout(() => setShowDeleteSuccessMessage(false), 4000);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (task: Task, status: Task["status"]) => {
    if (!currentUserEmail) return;
    if (task.assignedToEmail !== currentUserEmail) {
      setShowRestrictedMessage(true);
      window.setTimeout(() => setShowRestrictedMessage(false), 4000);
      return;
    }

    setUpdatingTaskId(task.id);
    try {
      const updatedTask = await updateTaskStatus(task.id, {
        status,
        requestedByEmail: currentUserEmail,
      });
      setTasks((prev) => prev.map((item) => (item.id === updatedTask.id ? updatedTask : item)));
      setStatusSuccessTaskName(updatedTask.name);
      setShowStatusSuccessMessage(true);
      window.setTimeout(() => setShowStatusSuccessMessage(false), 4000);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm border-purple-100">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-500" />
            Tareas del grupo
          </CardTitle>
          <CardDescription>Lista de tareas domesticas del grupo familiar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Cargando tareas...</p>
            </div>
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
          <CardDescription>Lista de tareas domesticas del grupo familiar</CardDescription>
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
            <p className="text-sm font-medium text-gray-900">Estado actualizado</p>
            <p className="text-xs text-gray-600 mt-0.5">La tarea "{statusSuccessTaskName}" fue actualizada</p>
          </div>
          <button onClick={() => setShowStatusSuccessMessage(false)} className="shrink-0 p-1 rounded-md hover:bg-gray-100" aria-label="Cerrar notificacion">
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      {showRestrictedMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-orange-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Accion restringida</p>
            <p className="text-xs text-gray-600 mt-0.5">Solo el responsable puede actualizar esta tarea.</p>
          </div>
          <button onClick={() => setShowRestrictedMessage(false)} className="shrink-0 p-1 rounded-md hover:bg-gray-100" aria-label="Cerrar notificacion">
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-purple-600" />
              </div>
              Asignar tarea
            </DialogTitle>
            <DialogDescription>
              Selecciona el miembro del grupo que sera responsable de esta tarea
            </DialogDescription>
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
                    {groupMembers.map((member) => (
                      <SelectItem key={member.email} value={member.email}>
                        {member.fullName}
                      </SelectItem>
                    ))}
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
            <DialogDescription>
              Esta accion no se puede deshacer. La tarea sera eliminada permanentemente.
            </DialogDescription>
          </DialogHeader>
          {taskToDelete && (
            <div className="space-y-5 mt-4">
              <div className="bg-red-50/50 border border-red-100 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Desea eliminar esta tarea?</p>
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

      <Card className="shadow-sm border-purple-100">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-500" />
            Tareas del grupo
          </CardTitle>
          <CardDescription>
            {tasks.length === 1 ? "1 tarea registrada" : `${tasks.length} tareas registradas`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="group p-4 bg-white border border-purple-100 rounded-lg hover:border-purple-300 hover:shadow-sm focus-within:border-purple-300 focus-within:shadow-sm transition-all"
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1 truncate">{task.name}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border " + getStatusBadgeStyle(task.status)}>
                      {getStatusIcon(task.status)}
                      {getStatusText(task.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Responsable</p>
                      <p className={(task.assignedToName ? "text-gray-700" : "text-gray-400 italic") + " truncate"}>
                        {task.assignedToName || "Sin asignar"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Prioridad</p>
                      <span className={"inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border " + getPriorityBadgeStyle(task.priority)}>
                        {getPriorityText(task.priority)}
                      </span>
                    </div>
                  </div>

                  {task.frequency && task.frequency !== "ninguna" ? (
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Frecuencia</p>
                        <p className="text-gray-700">{formatFrequency(task.frequency)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Fecha limite</p>
                        <p className="text-gray-700">{formatDate(task.deadline)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-purple-100 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={() => handleOpenAssignDialog(task)}
                      variant="outline"
                      size="sm"
                      className="h-9 border-purple-200 hover:bg-purple-50 flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      {task.assignedToEmail ? "Reasignar tarea" : "Asignar tarea"}
                    </Button>
                    <Select
                      value={task.status}
                      onValueChange={(value) => void handleStatusChange(task, value as Task["status"])}
                      disabled={updatingTaskId === task.id}
                    >
                      <SelectTrigger className="h-9 w-[160px] border-purple-200">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Sin empezar</SelectItem>
                        <SelectItem value="in_progress">En progreso</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        setTaskToDelete(task);
                        setDeleteDialogOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
