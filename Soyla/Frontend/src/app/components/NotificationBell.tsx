import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { AlertCircle, Bell, Check, CheckCheck, CheckCircle2, Clock, UserPlus, X } from "lucide-react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotification,
} from "../lib/api";

interface NotificationBellProps {
  currentUserEmail: string;
}

function formatTime(createdAt: string): string {
  const diffMin = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return new Date(createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function iconFor(notification: UserNotification) {
  if (notification.type === "completion") {
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  }
  if (notification.type === "assignment") {
    return <UserPlus className="h-5 w-5 text-purple-600" />;
  }
  if (notification.type === "due_soon") {
    return <Clock className="h-5 w-5 text-yellow-600" />;
  }
  return <AlertCircle className="h-5 w-5 text-red-600" />;
}

function iconShell(notification: UserNotification) {
  if (notification.type === "completion") return "bg-green-50 border-green-100";
  if (notification.type === "assignment") return "bg-purple-50 border-purple-100";
  if (notification.type === "due_soon") return "bg-yellow-50 border-yellow-100";
  return "bg-red-50 border-red-100";
}

export function NotificationBell({ currentUserEmail }: NotificationBellProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 });
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const refresh = async () => {
    if (!currentUserEmail) return;
    const loaded = await listNotifications(currentUserEmail);
    setNotifications(loaded);
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 2500);
    return () => window.clearInterval(interval);
  }, [currentUserEmail]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPanelPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  };

  const handleOpen = async () => {
    updatePosition();
    setOpen((value) => !value);
    setLoading(true);
    await refresh();
    setLoading(false);
  };

  const handleClickNotification = async (notification: UserNotification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id, currentUserEmail);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
      );
    }
    setOpen(false);
    navigate(`/grupo/${notification.groupId}`);
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead(currentUserEmail);
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => void handleOpen()}
        title="Notificaciones"
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
        className="relative min-w-[2.75rem] min-h-[2.75rem] rounded-full bg-white border-2 border-purple-100 flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 shadow-sm"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-[1.25rem] bg-purple-600 text-white text-xs font-semibold rounded-full flex items-center justify-center px-1.5 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border-2 border-purple-100 rounded-xl shadow-lg overflow-hidden"
            style={{ top: `${panelPosition.top}px`, right: `${panelPosition.right}px` }}
          >
            <div className="px-5 py-4 border-b-2 border-purple-50">
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
                  className="min-w-[2.25rem] min-h-[2.25rem] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full flex items-center justify-center"
                  aria-label="Cerrar notificaciones"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => void handleMarkAll()}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-md"
                >
                  <CheckCheck className="h-4 w-4" />
                  Marcar todas como leidas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Cargando notificaciones...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 px-4 text-center">
                  <Bell className="h-7 w-7 text-purple-300" />
                  <p className="text-sm text-gray-500">No tienes notificaciones pendientes</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="relative group">
                      <button
                        onClick={() => void handleClickNotification(notification)}
                        className={`w-full text-left flex items-start gap-3 px-5 py-4 transition-colors hover:bg-purple-50/60 ${
                          !notification.read ? "bg-purple-50/30" : "bg-white"
                        }`}
                      >
                        <div className={`min-w-[2.5rem] min-h-[2.5rem] rounded-lg flex items-center justify-center border-2 ${iconShell(notification)}`}>
                          {iconFor(notification)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-semibold truncate ${!notification.read ? "text-gray-900" : "text-gray-600"}`}>
                              {notification.title}
                            </p>
                            {!notification.read && <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-purple-500" />}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {notification.description}
                          </p>
                          <span className="text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                        </div>
                      </button>
                      {!notification.read && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void markNotificationRead(notification.id, currentUserEmail).then(() => {
                              setNotifications((prev) =>
                                prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
                              );
                            });
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 hover:bg-purple-50 border border-purple-200 text-purple-600 opacity-0 group-hover:opacity-100"
                          aria-label="Marcar como leida"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
