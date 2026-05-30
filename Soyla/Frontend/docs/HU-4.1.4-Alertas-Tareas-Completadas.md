# HU 4.1.4 – Recibir alertas de tareas domésticas completadas

## Descripción

Como miembro de un grupo familiar quiero recibir alertas de las tareas domésticas completadas de mi grupo familiar para poder verificar el progreso y cumplimiento de las tareas del hogar.

## Implementación

### Archivo modificado

`/src/app/components/TasksList.tsx`

No se crearon nuevos archivos ni se modificó el flujo de navegación.

### Criterios implementados

| Escenario | Estado | Detalle |
|-----------|--------|---------|
| 1. Alerta al completar tarea | ✅ | Toast + panel de actividad al detectar completado de otro miembro |
| 2. No alertar en otros estados | ✅ | `CompletionAlert` solo se crea cuando `newStatus === "completed"` |
| 3. Tiempo de entrega ≤ 5s | ✅ | Intervalo de polling cada 2 s; toast aparece en máx. ~2 s |
| 4. Disponibilidad continua | ✅ | Funciona en cualquier momento mientras la vista esté activa |

### Estructura de datos

```ts
// localStorage: "taskCompletionAlerts"
interface CompletionAlert {
  id: string;
  groupId: string;
  taskId: string;
  taskName: string;
  completedBy: string;        // email del responsable
  completedByName: string;    // nombre completo para mostrar
  completedAt: number;        // timestamp de completado
  seenBy: string[];           // emails que ya vieron la alerta
}
```

### Flujo

1. **Usuario A** cambia estado a "Completada" → `handleStatusChange` crea `CompletionAlert` en `localStorage.taskCompletionAlerts`. El propio usuario queda en `seenBy` (auto-vista).
2. **Usuario B** (otro miembro): el intervalo de 2 s ejecuta `checkCompletionAlerts`.
3. Detecta alertas del grupo donde `completedBy !== emailB` y `!seenBy.includes(emailB)`.
4. Marca como vista, muestra **toast verde** y actualiza **panel de actividad**.
5. Toast se oculta a los 5 s (dentro del límite de < 5 s del Escenario 3).

### Componentes visuales

#### Toast de completado (`fixed top-4 right-4 z-50`)
- Icono verde `CheckCircle2`
- Mensaje: "{Nombre} completó una tarea (+N más)"
- Subtexto: nombre de la tarea entre comillas
- Timestamp formateado ("Hace X min" / "Ahora")
- Se auto-oculta a los 5 segundos

#### Badge en el header del card
- Badge verde "N completada(s)" junto a los badges de urgencia (HU 4.1.2)
- Visible mientras el toast esté activo (5 s), luego desaparece

#### Panel de actividad reciente
- Aparece dentro del card "Tareas del grupo" cuando hay completados en el historial
- Header verde: "Actividad reciente" + badge "N nuevas"
- Cada ítem: punto indicador (verde = nueva, gris = vista) + "{Nombre} completó '{tarea}'" + timestamp
- Badge "Nueva" inline para completados en los últimos 5 minutos
- Muestra hasta 5 completados recientes del grupo
- Estados: alerta nueva (verde), vista (gris), sin actividad (panel oculto)

### Polling y timing

```ts
// Verificación cada 2 segundos → entrega máx ~2 s (bien dentro de 5 s)
const alertInterval = setInterval(() => {
  checkCompletionAlerts(userEmail);
}, 2000);

// También se verifica al cargar la página y al reconectar (online event)
```

### Restricciones respetadas

- No se implementó chat grupal, comentarios, ni respuestas a notificaciones.
- No hay correos automáticos, SMS ni push reales.
- No se creó historial avanzado — solo últimos 5 completados visibles.
- Solo se alerta al cambiar a "Completada" (Escenario 2 cumplido).
- No se modificó el flujo de navegación ni pantallas existentes.
