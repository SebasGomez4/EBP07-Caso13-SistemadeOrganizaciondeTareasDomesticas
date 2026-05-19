import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { Bell, CheckCircle2, AlertCircle, X, Clock, UserPlus, Check, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  type: "completion" | "overdue" | "assignment";
  title: string;
  description: string;
  timestamp: number;
  isRead: boolean;
  taskId: string;
  groupId: string;
  isDueSoon?: boolean;
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

function getUserGroups(email: string): string[] {
  const groups: Array<{ id: string; createdBy: string }> = JSON.parse(
    localStorage.getItem("familyGroups") || "[]"
  );
  const members: Record<string, string[]> = JSON.parse(
    localStorage.getItem("groupMembers") || "{}"
  );
  return groups
    .filter((g) => g.createdBy === email || (members[g.id] || []).includes(email))
    .map((g) => g.id);
}

function formatTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  const date = new Date(timestamp);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatDeadline(dateString: string): string {
  // Parsear manualmente para evitar problemas de UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function loadNotifications(email: string): Notification[] {
  const userGroupIds = getUserGroups(email);
  const notifications: Notification[] = [];

  const completionAlerts: CompletionAlert[] = JSON.parse(
    localStorage.getItem("taskCompletionAlerts") || "[]"
  );
  completionAlerts
    .filter((a) => userGroupIds.includes(a.groupId))
    .forEach((a) => {
      const isSelf = a.completedBy === email;
      notifications.push({
        id: `c-${a.id}`,
        type: "completion",
        title: "Tarea completada",
        description: isSelf
          ? `Completaste "${a.taskName}"`
          : `${a.completedByName} completó "${a.taskName}"`,
        timestamp: a.completedAt,
        isRead: a.seenBy.includes(email),
        taskId: a.taskId,
        groupId: a.groupId,
      });
    });

  const overdueAlerts: OverdueAlert[] = JSON.parse(
    localStorage.getItem("taskOverdueAlerts") || "[]"
  );
  overdueAlerts
    .filter((a) => userGroupIds.includes(a.groupId))
    .forEach((a) => {
      notifications.push({
        id: `o-${a.id}`,
        type: "overdue",
        title: a.isDueSoon ? "Tarea próxima a vencer" : "Tarea vencida",
        description: a.isDueSoon
          ? `"${a.taskName}" vence el ${formatDeadline(a.deadline)}`
          : `"${a.taskName}" (${a.assignedToName}) — Límite: ${formatDeadline(a.deadline)}`,
        timestamp: a.overdueAt,
        isRead: a.seenBy.includes(email),
        taskId: a.taskId,
        groupId: a.groupId,
        isDueSoon: a.isDueSoon,
      });
    });

  // ── HU 4.1.3: Alertas de tarea asignada al usuario actual ──
  const assignmentAlerts: AssignmentAlert[] = JSON.parse(
    localStorage.getItem("taskAssignmentAlerts") || "[]"
  );
  assignmentAlerts
    .filter((a) => userGroupIds.includes(a.groupId) && a.assignedTo === email)
    .forEach((a) => {
      notifications.push({
        id: `a-${a.id}`,
        type: "assignment",
        title: "Nueva tarea asignada",
        description: `Se te asignó "${a.taskName}"${a.taskDescription ? ` — ${a.taskDescription}` : ""}`,
        timestamp: a.assignedAt,
        isRead: a.seenBy.includes(email),
        taskId: a.taskId,
        groupId: a.groupId,
      });
    });

  return notifications.sort((a, b) => b.timestamp - a.timestamp);
}

function markNotificationRead(notif: Notification, email: string) {
  const rawId = notif.id.substring(2); // strip prefix ("c-", "o-", "a-")
  if (notif.type === "completion") {
    const alerts: CompletionAlert[] = JSON.parse(
      localStorage.getItem("taskCompletionAlerts") || "[]"
    );
    const updated = alerts.map((a) =>
      a.id === rawId && !a.seenBy.includes(email)
        ? { ...a, seenBy: [...a.seenBy, email] }
        : a
    );
    localStorage.setItem("taskCompletionAlerts", JSON.stringify(updated));
  } else if (notif.type === "overdue") {
    const alerts: OverdueAlert[] = JSON.parse(
      localStorage.getItem("taskOverdueAlerts") || "[]"
    );
    const updated = alerts.map((a) =>
      a.id === rawId && !a.seenBy.includes(email)
        ? { ...a, seenBy: [...a.seenBy, email] }
        : a
    );
    localStorage.setItem("taskOverdueAlerts", JSON.stringify(updated));
  } else {
    // assignment
    const alerts: AssignmentAlert[] = JSON.parse(
      localStorage.getItem("taskAssignmentAlerts") || "[]"
    );
    const updated = alerts.map((a) =>
      a.id === rawId && !a.seenBy.includes(email)
        ? { ...a, seenBy: [...a.seenBy, email] }
        : a
    );
    localStorage.setItem("taskAssignmentAlerts", JSON.stringify(updated));
  }
}

function markAllNotificationsRead(notifications: Notification[], email: string) {
  // Marcar todas las alertas de completitud
  const completionAlerts: CompletionAlert[] = JSON.parse(
    localStorage.getItem("taskCompletionAlerts") || "[]"
  );
  const updatedCompletions = completionAlerts.map((a) =>
    !a.seenBy.includes(email) ? { ...a, seenBy: [...a.seenBy, email] } : a
  );
  localStorage.setItem("taskCompletionAlerts", JSON.stringify(updatedCompletions));

  // Marcar todas las alertas de vencimiento
  const overdueAlerts: OverdueAlert[] = JSON.parse(
    localStorage.getItem("taskOverdueAlerts") || "[]"
  );
  const updatedOverdue = overdueAlerts.map((a) =>
    !a.seenBy.includes(email) ? { ...a, seenBy: [...a.seenBy, email] } : a
  );
  localStorage.setItem("taskOverdueAlerts", JSON.stringify(updatedOverdue));

  // Marcar todas las alertas de asignación
  const assignmentAlerts: AssignmentAlert[] = JSON.parse(
    localStorage.getItem("taskAssignmentAlerts") || "[]"
  );
  const updatedAssignments = assignmentAlerts.map((a) =>
    !a.seenBy.includes(email) ? { ...a, seenBy: [...a.seenBy, email] } : a
  );
  localStorage.setItem("taskAssignmentAlerts", JSON.stringify(updatedAssignments));
}

interface NotificationBellProps {
  currentUserEmail: string;
}

export function NotificationBell({ currentUserEmail }: NotificationBellProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const prevUnreadRef = useRef(0);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const refresh = () => {
    if (currentUserEmail) {
      setNotifications(loadNotifications(currentUserEmail));
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2500);
    return () => clearInterval(interval);
  }, [currentUserEmail]);

  // Animate bell when new unread notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && !open) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      prevUnreadRef.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, open]);

  // Cerrar panel al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Verificar que no sea el botón campana ni el panel
      if (
        bellButtonRef.current &&
        !bellButtonRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Calcular posición del panel respecto al botón campana
  const updatePanelPosition = () => {
    if (bellButtonRef.current) {
      const rect = bellButtonRef.current.getBoundingClientRect();
      setPanelPosition({
        top: rect.bottom + 8, // 8px de gap debajo del botón
        right: window.innerWidth - rect.right, // alineado a la derecha del botón
      });
    }
  };

  const handleOpen = () => {
    if (!open) {
      setLoading(true);
      updatePanelPosition(); // calcular posición antes de abrir
      setTimeout(() => {
        refresh();
        setLoading(false);
      }, 300);
    }
    setOpen((prev) => !prev);
  };

  // Recalcular posición en resize y scroll
  useEffect(() => {
    if (!open) return;

    const handleUpdate = () => updatePanelPosition();

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [open]);

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      markNotificationRead(notif, currentUserEmail);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    setOpen(false);
    navigate(`/grupo/${notif.groupId}`);
  };

  const handleMarkAsRead = (e: React.MouseEvent, notif: Notification) => {
    e.stopPropagation();
    if (!notif.isRead) {
      markNotificationRead(notif, currentUserEmail);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead(notifications, currentUserEmail);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <>
      {/* Botón campana */}
      <button
        ref={bellButtonRef}
        onClick={handleOpen}
        title="Notificaciones"
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative min-w-[2.75rem] min-h-[2.75rem] rounded-full bg-white border-2 border-purple-100 flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 focus-visible:ring-4 focus-visible:ring-purple-400/30 shadow-sm"
      >
        <Bell className={`h-5 w-5 text-gray-600 transition-transform ${isAnimating ? "animate-bounce" : ""}`} />
        {/* Ripple ping when new notifications arrive */}
        {isAnimating && unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 bg-purple-400 rounded-full animate-ping opacity-60"
            aria-hidden="true"
          />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-[1.25rem] bg-purple-600 text-white text-xs font-semibold rounded-full flex items-center justify-center px-1.5 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel desplegable - renderizado en portal fuera del árbol DOM */}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border-2 border-purple-100 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              top: `${panelPosition.top}px`,
              right: `${panelPosition.right}px`,
            }}
          >
          {/* Encabezado del panel */}
          <div className="px-4 sm:px-5 py-4 border-b-2 border-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="h-5 w-5 text-purple-600" />
                <span className="text-base font-semibold text-gray-800">Notificaciones</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="min-w-[2.25rem] min-h-[2.25rem] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                aria-label="Cerrar notificaciones"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {unreadCount > 0 && (
              <div className="mt-3">
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  Marcar todas como leídas
                </button>
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              /* Estado de carga */
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              /* Estado vacío */
              <div className="flex flex-col items-center justify-center py-12 gap-4 px-4 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-50 flex items-center justify-center">
                  <Bell className="h-6 w-6 sm:h-7 sm:w-7 text-purple-300" />
                </div>
                <p className="text-sm sm:text-base text-gray-500 leading-relaxed">No tienes notificaciones pendientes</p>
              </div>
            ) : (
              /* Lista de notificaciones */
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div key={notif.id} className="relative group">
                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left flex items-start gap-3 px-4 sm:px-5 py-4 transition-colors hover:bg-purple-50/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-purple-600 focus-visible:bg-purple-50 ${
                        !notif.isRead ? "bg-purple-50/30" : "bg-white"
                      }`}
                      aria-label={`${notif.title}: ${notif.description}${!notif.isRead ? " (no leída)" : ""}`}
                    >
                      {/* Ícono según tipo */}
                      <div
                        className={`min-w-[2.5rem] min-h-[2.5rem] rounded-lg flex items-center justify-center shrink-0 ${
                          notif.type === "completion"
                            ? "bg-green-50 border-2 border-green-100"
                            : notif.type === "assignment"
                            ? "bg-purple-50 border-2 border-purple-100"
                            : notif.isDueSoon
                            ? "bg-yellow-50 border-2 border-yellow-100"
                            : "bg-red-50 border-2 border-red-100"
                        }`}
                      >
                        {notif.type === "completion" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : notif.type === "assignment" ? (
                          <UserPlus className="h-5 w-5 text-purple-600" />
                        ) : notif.isDueSoon ? (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold truncate ${!notif.isRead ? "text-gray-900" : "text-gray-600"}`}>
                            {notif.title}
                          </p>
                          {/* Punto indicador de no leída */}
                          {!notif.isRead && (
                            <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-purple-500" aria-hidden="true" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {notif.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Clock className="h-4 w-4 text-gray-300" />
                          <span className="text-xs text-gray-400">{formatTime(notif.timestamp)}</span>
                        </div>
                      </div>
                    </button>
                    {/* Botón marcar como leída */}
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notif)}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 hover:bg-purple-50 border border-purple-200 text-purple-600 hover:text-purple-700 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                        aria-label="Marcar como leída"
                        title="Marcar como leída"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pie del panel */}
          {notifications.length > 0 && (
            <div className="border-t-2 border-purple-50 px-4 sm:px-5 py-3 bg-gray-50/50">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Selecciona una notificación para ir a la tarea
              </p>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
