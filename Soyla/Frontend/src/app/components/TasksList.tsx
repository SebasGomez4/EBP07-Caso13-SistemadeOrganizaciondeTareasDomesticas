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
}

interface TasksListProps {
  groupId: string;
  refreshTrigger?: number;
}

interface GroupMember {
  email: string;
  fullName: string;
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
      return "bg-green-100 text-green-700 border-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "pending":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "completed":
      return "Completada";
    case "in_progress":
      return "En progreso";
    case "pending":
      return "Pendiente";
    default:
      return "Pendiente";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-600" />;
    case "pending":
      return <CircleDashed className="h-4 w-4 text-gray-600" />;
    default:
      return <CircleDashed className="h-4 w-4 text-gray-600" />;
  }
}

function getPriorityBadgeStyle(priority?: string) {
  switch (priority) {
    case "alta":
      return "bg-red-100 text-red-700 border-red-200";
    case "media":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "baja":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

function getPriorityText(priority?: string) {
  if (!priority) return "Sin prioridad";
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
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
    return {
      email,
      fullName: user?.fullName || email,
    };
  });
}

export function TasksList({ groupId, refreshTrigger }: TasksListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Estados para asignación de tareas ──
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successTaskName, setSuccessTaskName] = useState("");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // ── Estados para eliminación de tareas ──
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccessMessage, setShowDeleteSuccessMessage] = useState(false);
  const [deletedTaskName, setDeletedTaskName] = useState("");

  useEffect(() => {
    // Simular tiempo de carga (menos de 2 segundos)
    const loadData = () => {
      setLoading(true);
      setTimeout(() => {
        const loadedTasks = loadTasks(groupId);
        setTasks(loadedTasks);
        setLoading(false);
      }, 600);
    };

    loadData();

    // Cargar miembros del grupo
    const members = loadGroupMembers(groupId);
    setGroupMembers(members);

    // Actualización dinámica cada 3 segundos (Escenario 6)
    const interval = setInterval(() => {
      const loadedTasks = loadTasks(groupId);
      setTasks(loadedTasks);
    }, 3000);

    return () => clearInterval(interval);
  }, [groupId, refreshTrigger]);

  // ── Manejar apertura del dialog de asignación ──
  const handleOpenAssignDialog = (task: Task) => {
    setSelectedTask(task);
    setSelectedMember(task.assignedTo || "");
    setAssignDialogOpen(true);
  };

  // ── Manejar asignación de tarea ──
  const handleAssignTask = () => {
    if (!selectedTask || !selectedMember) return;

    setIsAssigning(true);

    // Simular procesamiento (menos de 3 segundos)
    setTimeout(() => {
      // Actualizar la tarea en localStorage
      const allTasks: Task[] = JSON.parse(localStorage.getItem("familyTasks") || "[]");
      const updatedTasks = allTasks.map((task) =>
        task.id === selectedTask.id ? { ...task, assignedTo: selectedMember } : task
      );
      localStorage.setItem("familyTasks", JSON.stringify(updatedTasks));

      // Actualizar vista local
      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id ? { ...task, assignedTo: selectedMember } : task
        )
      );

      // Cerrar dialog y mostrar mensaje de éxito
      setAssignDialogOpen(false);
      setIsAssigning(false);
      setSuccessTaskName(selectedTask.name);
      setShowSuccessMessage(true);

      // Ocultar mensaje después de 4 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 4000);

      // Limpiar selección
      setSelectedTask(null);
      setSelectedMember("");
    }, 1200);
  };

  // ── Manejar apertura del dialog de eliminación ──
  const handleOpenDeleteDialog = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  // ── Manejar eliminación de tarea ──
  const handleDeleteTask = () => {
    if (!taskToDelete) return;

    setIsDeleting(true);

    // Simular procesamiento (menos de 3 segundos)
    setTimeout(() => {
      // Eliminar la tarea de localStorage
      const allTasks: Task[] = JSON.parse(localStorage.getItem("familyTasks") || "[]");
      const updatedTasks = allTasks.filter((task) => task.id !== taskToDelete.id);
      localStorage.setItem("familyTasks", JSON.stringify(updatedTasks));

      // Actualizar vista local
      setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id));

      // Cerrar dialog y mostrar mensaje de éxito
      setDeleteDialogOpen(false);
      setIsDeleting(false);
      setDeletedTaskName(taskToDelete.name);
      setShowDeleteSuccessMessage(true);

      // Ocultar mensaje después de 4 segundos
      setTimeout(() => {
        setShowDeleteSuccessMessage(false);
      }, 4000);

      // Limpiar selección
      setTaskToDelete(null);
    }, 1000);
  };

  // Estado de carga
  if (loading) {
    return (
      <Card className="shadow-sm border-purple-100">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-500" />
            Tareas del grupo
          </CardTitle>
          <CardDescription>Lista de tareas domésticas del grupo familiar</CardDescription>
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

  // Estado vacío
  if (tasks.length === 0) {
    return (
      <Card className="shadow-sm border-purple-100">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-500" />
            Tareas del grupo
          </CardTitle>
          <CardDescription>Lista de tareas domésticas del grupo familiar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-gray-600 font-medium mb-1">No existen tareas registradas</p>
            <p className="text-sm text-gray-500">
              Crea una tarea para empezar a organizar las responsabilidades del hogar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Lista de tareas
  return (
    <>
      {/* Mensaje de éxito - Asignación */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">Tarea asignada exitosamente</p>
            <p className="text-xs text-gray-600 mt-0.5">
              La tarea "{successTaskName}" fue asignada correctamente
            </p>
          </div>
        </div>
      )}

      {/* Mensaje de éxito - Eliminación */}
      {showDeleteSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">Tarea eliminada exitosamente</p>
            <p className="text-xs text-gray-600 mt-0.5">
              La tarea "{deletedTaskName}" fue eliminada correctamente
            </p>
          </div>
        </div>
      )}

      {/* Dialog de asignación */}
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
              Selecciona el miembro del grupo que será responsable de esta tarea
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-5 mt-4">
              {/* Tarea seleccionada */}
              <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Tarea a asignar</p>
                <p className="font-medium text-gray-900">{selectedTask.name}</p>
                {selectedTask.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              {/* Selector de miembro */}
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

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignDialogOpen(false)}
                  disabled={isAssigning}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAssignTask}
                  disabled={!selectedMember || isAssigning}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
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

      {/* Dialog de eliminación */}
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
              Esta acción no se puede deshacer. La tarea será eliminada permanentemente.
            </DialogDescription>
          </DialogHeader>

          {taskToDelete && (
            <div className="space-y-5 mt-4">
              {/* Tarea a eliminar */}
              <div className="bg-red-50/50 border border-red-100 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">¿Desea eliminar esta tarea?</p>
                <p className="font-medium text-gray-900">{taskToDelete.name}</p>
                {taskToDelete.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {taskToDelete.description}
                  </p>
                )}
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
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

      {/* Lista de tareas */}
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
                {/* Encabezado de la tarea */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1 truncate">{task.name}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusBadgeStyle(
                        task.status
                      )}`}
                    >
                      {getStatusIcon(task.status)}
                      {getStatusText(task.status)}
                    </span>
                  </div>
                </div>

                {/* Información de la tarea */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  {/* Responsable */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Responsable</p>
                      <p
                        className={`truncate ${
                          task.assignedTo ? "text-gray-700" : "text-gray-400 italic"
                        }`}
                      >
                        {getAssigneeName(task.assignedTo)}
                      </p>
                    </div>
                  </div>

                  {/* Prioridad */}
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Prioridad</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getPriorityBadgeStyle(
                          task.priority
                        )}`}
                      >
                        {getPriorityText(task.priority)}
                      </span>
                    </div>
                  </div>

                  {/* Fecha límite o Frecuencia (mutuamente excluyentes) */}
                  {task.frequency && task.frequency !== "ninguna" ? (
                    /* Mostrar frecuencia */
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Frecuencia</p>
                        <p className="text-gray-700">{formatFrequency(task.frequency)}</p>
                      </div>
                    </div>
                  ) : (
                    /* Mostrar fecha límite */
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Fecha límite</p>
                        <p className="text-gray-700">
                          {task.deadline ? formatDate(task.deadline) : "No definida"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de acción (visibles solo en hover/focus) */}
                <div className="pt-3 mt-3 border-t border-purple-100 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={() => handleOpenAssignDialog(task)}
                      variant="outline"
                      size="sm"
                      className="h-9 border-purple-200 hover:bg-purple-50 flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      {task.assignedTo ? "Reasignar tarea" : "Asignar tarea"}
                    </Button>
                    <Button
                      onClick={() => handleOpenDeleteDialog(task)}
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
        </CardContent>
      </Card>
    </>
  );
}
