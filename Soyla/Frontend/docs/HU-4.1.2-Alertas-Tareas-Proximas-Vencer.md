# HU 4.1.2 – Recibir alertas de tareas domésticas próximas a vencer

## Descripción

Como miembro de un grupo familiar quiero recibir alertas de mis tareas domésticas próximas a vencer para poder organizarme y priorizar esa tarea.

## Implementación

### Archivo modificado

`/src/app/components/TasksList.tsx`

No se crearon nuevos archivos ni se modificó el flujo de navegación.

### Criterios implementados

| Escenario | Estado | Detalle |
|-----------|--------|---------|
| 1. Tarea próxima a vencer | ✅ | Toast y banner al cargar si hay tareas vencidas/próximas asignadas al usuario |
| 2. Tarea no próxima a vencer | ✅ | Sin alertas si no hay tareas urgentes. `sessionStorage` evita repeticiones |
| 3. Tiempo de entrega < 5s | ✅ | Toast aparece tras la carga inicial (~600ms), bien dentro del límite |
| 4. Sincronización al reconectar | ✅ | Listener `online` dispara re-check y toast en ~800ms (< 10s) |

### Definición de "próxima a vencer"

- **Vencida** (`isTaskOverdue`): `deadline` anterior a hoy, tarea no completada y sin frecuencia.
- **Próxima a vencer** (`isTaskDueSoon`): `deadline` dentro de las próximas **48 horas**, tarea no completada y sin frecuencia.
- Las tareas con `frequency` (diaria/semanal/mensual) no tienen fecha fija y **no generan alertas**.

### Componentes de alerta integrados

#### 1. Toast de notificación (`fixed top-4 right-4`)
- Aparece al cargar la página si el usuario tiene tareas urgentes no alertadas aún.
- También se dispara al recuperar conexión (evento `online`).
- Muestra nombre de la primera tarea y cantidad total.
- Se oculta automáticamente a los 5 segundos.
- Usa `sessionStorage` por clave `alertedDueSoon_{groupId}` para no repetir alertas en la misma sesión.

#### 2. Toast de reconexión
- Aparece al detectar el evento `window.online`.
- Mensaje: "Conexión restaurada · Sincronizando alertas..."
- Se oculta tras completar la sincronización (~800ms).

#### 3. Banner en el card de tareas
- Visible dentro de la tarjeta "Tareas del grupo", antes de la lista.
- **Banner rojo** para tareas vencidas: `bg-red-50 border-red-200`.
- **Banner amarillo** para tareas próximas a vencer: `bg-yellow-50 border-yellow-200`.
- Solo visible cuando el usuario tiene tareas que le corresponden en estado urgente.

#### 4. Indicadores en el header del card
- Badges de conteo (`rounded-full`) junto al título de la tarjeta.
- Rojo: "N vencida(s)" | Amarillo: "N próxima(s)".

#### 5. Badge inline en cada tarea
- Dentro del encabezado de cada task card.
- Para tareas propias: "Tu tarea está vencida" / "Vence pronto".
- Para tareas de otros: "Vencida" / "Próxima a vencer" (resalte más suave).

#### 6. Resalte visual del card de tarea
- **Borde rojo** + `bg-red-50/30` para tareas vencidas del usuario.
- **Borde amarillo** + `bg-yellow-50/30` para tareas próximas del usuario.
- Versión más suave (sin fondo) para tareas urgentes de otros miembros.
- La fecha límite se colorea en rojo/amarillo según urgencia.

### Persistencia de alertas

```ts
// sessionStorage por grupo para no repetir toasts en la misma sesión
const alertKey = `alertedDueSoon_${groupId}`;
const alerted: string[] = JSON.parse(sessionStorage.getItem(alertKey) || "[]");
// Se limpia automáticamente al cerrar el navegador
```

### Listener de reconexión

```ts
const handleOnline = () => {
  setShowReconnectNotice(true);
  setTimeout(() => {
    const loadedTasks = loadTasks(groupId);
    setTasks(loadedTasks);
    checkAndShowAlerts(loadedTasks, userEmail); // < 10 segundos (800ms)
    setShowReconnectNotice(false);
  }, 800);
};
window.addEventListener("online", handleOnline);
```

## Restricciones respetadas

- No se implementó centro de notificaciones.
- No se agregaron correos, SMS ni push reales.
- No hay recordatorios repetitivos (la alerta se muestra una vez por sesión por tarea).
- No se inventaron nuevas reglas de vencimiento fuera del `deadline` existente.
- El flujo de navegación y las pantallas existentes no fueron modificados.
