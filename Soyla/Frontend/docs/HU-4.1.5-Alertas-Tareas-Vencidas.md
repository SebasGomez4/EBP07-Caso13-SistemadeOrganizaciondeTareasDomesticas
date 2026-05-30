# HU 4.1.5 – Recibir alertas de tareas domésticas vencidas

## Descripción

Como miembro de un grupo familiar quiero recibir alertas de las tareas domésticas que se han vencido para poder estar informado del incumplimiento de las tareas y tomar acción.

## Implementación

### Archivo modificado

`/src/app/components/TasksList.tsx`

No se crearon nuevos archivos ni se modificó el flujo de navegación.

### Criterios implementados

| Escenario | Estado | Detalle |
|-----------|--------|---------|
| 1. Alerta cuando tarea vence | ✅ | Sistema detecta tareas con fecha límite superada y estado diferente de "Completada". Crea alerta con nombre, responsable y fecha límite |
| 2. No alertar si completada a tiempo | ✅ | `isTaskOverdue()` retorna `false` si `status === "completed"`. Al completar, se elimina alerta de vencimiento existente |
| 3. Tiempo de generación ≤ 5s | ✅ | Polling cada 2-3 s detecta vencimientos; toast aparece en máx. ~2 s |
| 4. Evitar duplicados | ✅ | Registro en `localStorage.taskOverdueAlerts` mantiene IDs alertadas; solo alerta tareas nuevas vencidas |

### Estructura de datos

```ts
// localStorage: "taskOverdueAlerts"
interface OverdueAlert {
  id: string;
  groupId: string;
  taskId: string;
  taskName: string;
  assignedTo: string;        // email del responsable
  assignedToName: string;    // nombre completo
  deadline: string;          // fecha límite incumplida
  overdueAt: number;         // timestamp cuando se detectó el vencimiento
  seenBy: string[];          // emails que ya vieron la alerta
}
```

### Flujo

1. **Polling cada 3 s** ejecuta `checkAndCreateOverdueAlerts` con todas las tareas del grupo.
2. **Detecta tareas vencidas** usando `isTaskOverdue()`: fecha límite superada + estado ≠ "completed".
3. **Filtra duplicados**: verifica que `taskId` no exista en `localStorage.taskOverdueAlerts`.
4. **Crea nueva alerta** con datos de tarea (nombre, responsable, fecha límite) y timestamp actual.
5. **Guarda en localStorage** y marca como no vista (`seenBy: []`).
6. **Polling cada 2 s** ejecuta `checkOverdueAlerts` para cada usuario:
   - Filtra alertas del grupo no vistas por el usuario actual
   - Marca como vistas en localStorage
   - Muestra **toast rojo** con información de la tarea vencida
   - Actualiza **panel de alertas de vencimiento**
7. Toast se auto-oculta a los 5 s.
8. **Al completar tarea**: elimina alerta de vencimiento asociada (Escenario 2).

### Componentes visuales

#### Toast de vencimiento (`fixed top-20 right-4 z-50`)
- Posicionado debajo del toast de completado para evitar superposición
- Fondo blanco, borde rojo (`border-red-200`)
- Icono rojo `AlertCircle` en círculo con fondo `bg-red-50`
- Título: "Tarea vencida (+N más)"
- Subtexto 1: nombre de la tarea entre comillas
- Subtexto 2: icono de usuario + nombre del responsable
- Subtexto 3: "Vencimiento: {fecha límite}" en rojo
- Se auto-oculta a los 5 segundos

#### Badge en el header del card
- Badge rojo "N alerta(s) de vencimiento" junto a otros badges
- Visible mientras haya alertas nuevas no vistas
- Desaparece cuando el usuario las ve (dentro del periodo de 5 s del toast)

#### Panel de alertas de vencimiento
- Aparece **antes** del panel de actividad reciente
- Header rojo: "Alertas de vencimiento" + badge "N nueva(s)"
- Cada ítem:
  - Punto indicador (rojo = nueva últimos 5 min, gris = vista)
  - Texto: "La tarea '{nombre}' ha vencido"
  - Subtexto 1: icono usuario + "{Nombre} no completó antes de la fecha límite"
  - Subtexto 2: "Fecha límite: {fecha}" en rojo
  - Badge "Nueva" inline para alertas recientes
- Muestra hasta 5 alertas más recientes del grupo
- Estados: nueva (punto rojo + badge), vista (punto gris), sin alertas (panel oculto)

### Polling y timing

```ts
// Verificación de tareas cada 3 segundos → detecta vencimientos
const interval = setInterval(() => {
  const loadedTasks = loadTasks(groupId);
  setTasks(loadedTasks);
  checkAndCreateOverdueAlerts(loadedTasks); // HU 4.1.5
}, 3000);

// Verificación de alertas cada 2 segundos → entrega máx ~2 s (bien dentro de 5 s)
const alertInterval = setInterval(() => {
  checkCompletionAlerts(userEmail); // HU 4.1.4
  checkOverdueAlerts(userEmail);    // HU 4.1.5
}, 2000);

// También se verifica al cargar y al reconectar (online event)
```

### Integración con otras HU

#### Con HU 4.1.2 (Alertas de vencimiento próximo)
- Comparte función `isTaskOverdue()` para detectar vencimientos
- Resaltado visual de tareas vencidas en cards (borde rojo, fondo rojo claro)
- Los badges de "vencida" en cards individuales complementan las alertas

#### Con HU 3.2.1 (Cambio de estado)
- Al marcar tarea como "Completada", elimina su alerta de vencimiento
- Evita mostrar alertas de tareas que fueron completadas aunque fuera tarde

#### Con HU 4.1.4 (Alertas de completado)
- Toast de vencimiento posicionado en `top-20` para no sobreponerse con toast de completado (`top-4`)
- Ambos paneles visibles simultáneamente en el card (vencimiento arriba, completado abajo)
- Mismo patrón de diseño (indicadores de color, badges "Nueva", formato de tiempo)

### Prevención de duplicados (Escenario 4)

```ts
// Solo alerta tareas que no están ya en localStorage.taskOverdueAlerts
const existingAlertTaskIds = allOverdueAlerts.map((a) => a.taskId);
const newlyOverdue = loadedTasks.filter(
  (t) => isTaskOverdue(t) && !existingAlertTaskIds.includes(t.id) && t.assignedTo
);

// Al completar tarea, elimina su alerta para evitar duplicados futuros
if (newStatus === "completed") {
  const filteredOverdueAlerts = allOverdueAlerts.filter((a) => a.taskId !== task.id);
  localStorage.setItem("taskOverdueAlerts", JSON.stringify(filteredOverdueAlerts));
}
```

### Restricciones respetadas

- No se implementaron recordatorios múltiples, correos automáticos, SMS ni sanciones.
- No se creó historial avanzado — solo últimas 5 alertas visibles.
- No se modificó el flujo general del sistema ni se rediseñaron pantallas existentes.
- Solo se alerta cuando fecha límite se supera Y estado ≠ "Completada" (Escenario 1 y 2).
- No se inventaron nuevos estados de tarea ni funcionalidades no especificadas.
- Diseño minimalista consistente con el sistema existente (colores, bordes redondeados, sombras suaves).
- Se evitaron popups agresivos, sonidos automáticos y animaciones excesivas.
- Integración natural con componentes existentes (Task cards, badges, toasts, paneles).
