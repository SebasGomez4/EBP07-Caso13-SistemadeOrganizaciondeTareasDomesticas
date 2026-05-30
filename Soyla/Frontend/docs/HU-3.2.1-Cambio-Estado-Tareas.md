# HU 3.2.1 – Cambio de Estado de una Tarea Doméstica

## Resumen de implementación

Este documento describe la implementación de la funcionalidad de cambio de estado de tareas domésticas según los criterios de aceptación de la Historia de Usuario 3.2.1.

## Descripción

Como miembro de un grupo familiar quiero cambiar el estado de una tarea doméstica asignada para poder informar el progreso de la tarea al resto del grupo.

## Componente modificado

### TasksList (`/src/app/components/TasksList.tsx`)

El componente de lista de tareas ahora incluye un selector de estado integrado en cada card de tarea, permitiendo a los usuarios responsables actualizar el progreso de sus tareas asignadas.

## Funcionalidades implementadas

### Escenario 1: Estado por defecto

**Implementación:**
- Al crear una tarea nueva, el estado por defecto es `"pending"` (Sin empezar)
- El campo `status` se inicializa con valor `"pending"` en `CreateTaskForm.tsx`
- La función `getStatusText()` muestra "Sin empezar" para el estado `pending`

**Código del estado por defecto:**
```typescript
// En CreateTaskForm.tsx (línea 129)
const newTask = {
  id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  groupId: groupId,
  name: formData.name.trim(),
  description: formData.description.trim(),
  deadline: formData.frequency === "ninguna" ? formData.deadline : "",
  frequency: formData.frequency,
  createdAt: Date.now(),
  status: "pending", // Estado por defecto: Sin empezar
};
```

**Visualización del estado:**
```typescript
function getStatusText(status: string) {
  switch (status) {
    case "completed":
      return "Completada";
    case "in_progress":
      return "En progreso";
    case "pending":
      return "Sin empezar"; // Actualizado de "Pendiente"
    default:
      return "Sin empezar";
  }
}
```

### Escenario 2: Cambio a "En progreso"

**Implementación:**
- Selector `<Select>` con tres opciones de estado
- Opción "En progreso" con valor `in_progress`
- Al seleccionar, se dispara `handleStatusChange(task, "in_progress")`
- El cambio se refleja inmediatamente en la UI

**Código del selector:**
```typescript
<Select
  value={task.status}
  onValueChange={(newStatus) => handleStatusChange(task, newStatus)}
  disabled={
    updatingTaskId === task.id ||
    !task.assignedTo ||
    task.assignedTo !== currentUserEmail
  }
>
  <SelectTrigger className="h-9 text-sm">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pending">Sin empezar</SelectItem>
    <SelectItem value="in_progress">En progreso</SelectItem>
    <SelectItem value="completed">Completada</SelectItem>
  </SelectContent>
</Select>
```

### Escenario 3: Cambio a "Completada"

**Implementación:**
- Opción "Completada" con valor `completed` en el selector
- Al seleccionar, se actualiza el estado a "completed"
- Badge visual cambia a verde con ícono de check
- El cambio persiste en localStorage

**Estilos visuales del estado completado:**
```typescript
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
```

### Escenario 4: Restricción de modificación

**Implementación:**
- Validación que compara `task.assignedTo` con `currentUserEmail`
- Si no coinciden, el selector se deshabilita
- Se muestra mensaje: "Solo el responsable puede actualizar esta tarea"
- Si el usuario intenta cambiar (aunque esté deshabilitado), se muestra notificación de restricción

**Código de validación:**
```typescript
const handleStatusChange = (task: Task, newStatus: string) => {
  // Escenario 4: Restricción de modificación
  if (task.assignedTo && task.assignedTo !== currentUserEmail) {
    setRestrictedTaskName(task.name);
    setShowRestrictedMessage(true);
    setTimeout(() => {
      setShowRestrictedMessage(false);
    }, 4000);
    return;
  }

  // Si la tarea no está asignada, también restringir
  if (!task.assignedTo) {
    setRestrictedTaskName(task.name);
    setShowRestrictedMessage(true);
    setTimeout(() => {
      setShowRestrictedMessage(false);
    }, 4000);
    return;
  }

  // Continuar con actualización...
};
```

**Selector deshabilitado visualmente:**
```typescript
<Select
  value={task.status}
  onValueChange={(newStatus) => handleStatusChange(task, newStatus)}
  disabled={
    updatingTaskId === task.id ||
    !task.assignedTo ||
    task.assignedTo !== currentUserEmail
  }
>
  <SelectTrigger
    className={`h-9 text-sm ${
      !task.assignedTo || task.assignedTo !== currentUserEmail
        ? "cursor-not-allowed opacity-60"
        : ""
    }`}
  >
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {/* Opciones */}
  </SelectContent>
</Select>

{(!task.assignedTo || task.assignedTo !== currentUserEmail) && (
  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
    <AlertCircle className="h-3 w-3" />
    Solo el responsable puede actualizar esta tarea
  </p>
)}
```

**Mensaje de restricción:**
```typescript
{showRestrictedMessage && (
  <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-orange-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
    <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
    <div>
      <p className="text-sm font-medium text-gray-900">Acción no permitida</p>
      <p className="text-xs text-gray-600 mt-0.5">
        Solo el responsable puede actualizar esta tarea
      </p>
    </div>
  </div>
)}
```

### Escenario 5: Actualización visible para el grupo

**Implementación:**
- El cambio de estado se guarda en localStorage inmediatamente
- El componente tiene un `setInterval` que recarga las tareas cada 3 segundos
- Esto simula la sincronización en "tiempo real" para todos los usuarios
- Todos los miembros del grupo ven el estado actualizado

**Código de actualización:**
```typescript
// Actualizar en localStorage
const allTasks: Task[] = JSON.parse(localStorage.getItem("familyTasks") || "[]");
const updatedTasks = allTasks.map((t) =>
  t.id === task.id ? { ...t, status: newStatus as Task["status"] } : t
);
localStorage.setItem("familyTasks", JSON.stringify(updatedTasks));

// Actualizar vista local inmediatamente
setTasks((prev) =>
  prev.map((t) => (t.id === task.id ? { ...t, status: newStatus as Task["status"] } : t))
);
```

**Sincronización automática:**
```typescript
// En useEffect (línea 206-211)
const interval = setInterval(() => {
  const loadedTasks = loadTasks(groupId);
  setTasks(loadedTasks);
}, 3000);

return () => clearInterval(interval);
```

### Escenario 6: Tiempo de respuesta

**Implementación:**
- Operación simulada con `setTimeout` de 800ms
- Cumple con el requisito de < 3 segundos
- Durante la actualización:
  - Selector se deshabilita
  - Mensaje de loading: "Actualizando estado..."
  - Spinner animado
- Al completar:
  - Mensaje de éxito: "Estado actualizado exitosamente"

**Código del tiempo de respuesta:**
```typescript
setUpdatingTaskId(task.id);

// Escenario 6: Completar en menos de 3 segundos (simulamos 800ms)
setTimeout(() => {
  // Actualizar localStorage y vista local
  // ...

  setUpdatingTaskId(null);
  setStatusSuccessTaskName(task.name);
  setShowStatusSuccessMessage(true);

  setTimeout(() => {
    setShowStatusSuccessMessage(false);
  }, 4000);
}, 800);
```

**Indicador visual durante actualización:**
```typescript
{updatingTaskId === task.id && (
  <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
    <Loader2 className="h-3 w-3 animate-spin" />
    Actualizando estado...
  </p>
)}
```

### Escenario 7: Consistencia de información

**Implementación:**
- El estado se persiste correctamente en localStorage
- La función `loadTasks()` siempre lee el último estado guardado
- El intervalo de actualización automática (cada 3s) garantiza que todos vean el último estado
- No hay conflictos ni inconsistencias en el estado mostrado

**Persistencia garantizada:**
```typescript
const handleStatusChange = (task: Task, newStatus: string) => {
  // Validaciones...
  
  setTimeout(() => {
    // 1. Actualizar localStorage (fuente de verdad)
    const allTasks: Task[] = JSON.parse(localStorage.getItem("familyTasks") || "[]");
    const updatedTasks = allTasks.map((t) =>
      t.id === task.id ? { ...t, status: newStatus as Task["status"] } : t
    );
    localStorage.setItem("familyTasks", JSON.stringify(updatedTasks));

    // 2. Actualizar vista local (sincronización inmediata)
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus as Task["status"] } : t))
    );
    
    // 3. El intervalo de 3s asegura que todos los usuarios vean el cambio
  }, 800);
};
```

## Estados de tarea

### Estados disponibles

| Estado interno | Texto mostrado | Color | Icono |
|---------------|----------------|-------|-------|
| `pending` | Sin empezar | Gris | CircleDashed |
| `in_progress` | En progreso | Azul | Clock |
| `completed` | Completada | Verde | CheckCircle2 |

### Flujo de estados

```
Sin empezar (pending)
    ↓
En progreso (in_progress)
    ↓
Completada (completed)
```

Los usuarios pueden cambiar entre cualquier estado en cualquier dirección, no hay restricciones de flujo unidireccional.

## Elementos visuales

### Selector de estado
```typescript
<div className="mb-3 pb-3 border-b border-purple-100">
  <label className="text-xs text-gray-500 mb-2 block">Cambiar estado</label>
  <Select
    value={task.status}
    onValueChange={(newStatus) => handleStatusChange(task, newStatus)}
    disabled={
      updatingTaskId === task.id ||
      !task.assignedTo ||
      task.assignedTo !== currentUserEmail
    }
  >
    <SelectTrigger
      className={`h-9 text-sm ${
        !task.assignedTo || task.assignedTo !== currentUserEmail
          ? "cursor-not-allowed opacity-60"
          : ""
      }`}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="pending">Sin empezar</SelectItem>
      <SelectItem value="in_progress">En progreso</SelectItem>
      <SelectItem value="completed">Completada</SelectItem>
    </SelectContent>
  </Select>
  
  {/* Mensajes condicionales */}
</div>
```

### Badge de estado (header de la card)
```typescript
<span
  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusBadgeStyle(
    task.status
  )}`}
>
  {getStatusIcon(task.status)}
  {getStatusText(task.status)}
</span>
```

### Mensajes de notificación

**Éxito:**
```typescript
<div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
  <div>
    <p className="text-sm font-medium text-gray-900">Estado actualizado exitosamente</p>
    <p className="text-xs text-gray-600 mt-0.5">
      El estado de "{statusSuccessTaskName}" se actualizó correctamente
    </p>
  </div>
</div>
```

**Restricción:**
```typescript
<div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-orange-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
  <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
  <div>
    <p className="text-sm font-medium text-gray-900">Acción no permitida</p>
    <p className="text-xs text-gray-600 mt-0.5">
      Solo el responsable puede actualizar esta tarea
    </p>
  </div>
</div>
```

## Estilos aplicados

### Selector de estado
- `h-9`: Altura estándar para selectores
- `text-sm`: Tamaño de texto pequeño
- `cursor-not-allowed opacity-60`: Cuando está deshabilitado
- `border-b border-purple-100`: Separador visual después del selector

### Mensaje de restricción
- `text-xs text-gray-500`: Texto pequeño y sutil
- `flex items-center gap-1`: Alineación con ícono
- `mt-1.5`: Margen superior mínimo

### Mensaje de loading
- `text-xs text-blue-600`: Color azul para indicar proceso
- `animate-spin`: Animación de spinner

### Notificaciones toast
- `fixed top-4 right-4 z-50`: Posición fija en esquina superior derecha
- `shadow-lg rounded-lg`: Sombra y bordes redondeados
- `px-5 py-3`: Padding interno
- `max-w-md`: Ancho máximo para evitar notificaciones muy anchas

## Validaciones de seguridad

1. **Validación de responsable:** Solo el usuario asignado puede cambiar el estado
2. **Validación de asignación:** Si la tarea no está asignada, nadie puede cambiar el estado
3. **Selector deshabilitado:** Visualmente bloqueado para usuarios no autorizados
4. **Mensaje informativo:** Siempre visible para usuarios no autorizados
5. **Protección durante actualización:** Selector deshabilitado mientras se procesa el cambio

## Flujo completo de cambio de estado

1. **Usuario responsable** visualiza la tarea asignada a su email
2. Ve el selector de estado habilitado
3. Selecciona un nuevo estado del dropdown
4. Se dispara `handleStatusChange(task, newStatus)`
5. Validación: ¿Es el responsable?
   - **Sí:** Continúa al paso 6
   - **No:** Muestra notificación de restricción y termina
6. Selector se deshabilita y muestra "Actualizando estado..."
7. Después de 800ms:
   - Se actualiza localStorage
   - Se actualiza la vista local
   - Se muestra notificación de éxito
8. El selector se reactiva
9. El badge en el header muestra el nuevo estado
10. Otros miembros del grupo ven el cambio en máximo 3 segundos (gracias al intervalo)

## Estados de localStorage

### Estructura de tarea en localStorage

```json
{
  "id": "task-1715963456789-abc123",
  "groupId": "group-xyz",
  "name": "Lavar la ropa",
  "description": "Separar ropa blanca y de color",
  "deadline": "2026-05-20",
  "frequency": "ninguna",
  "assignedTo": "user@example.com",
  "status": "in_progress",
  "createdAt": 1715963456789
}
```

### Ejemplo de transformación

**Antes del cambio:**
```json
{
  "id": "task-123",
  "status": "pending",
  "assignedTo": "user@example.com"
}
```

**Después del cambio a "En progreso":**
```json
{
  "id": "task-123",
  "status": "in_progress",
  "assignedTo": "user@example.com"
}
```

## Estados del componente

### Estados agregados para HU 3.2.1

```typescript
const [currentUserEmail, setCurrentUserEmail] = useState("");
const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
const [showStatusSuccessMessage, setShowStatusSuccessMessage] = useState(false);
const [statusSuccessTaskName, setStatusSuccessTaskName] = useState("");
const [showRestrictedMessage, setShowRestrictedMessage] = useState(false);
const [restrictedTaskName, setRestrictedTaskName] = useState("");
```

## Funciones agregadas

- `handleStatusChange(task, newStatus)`: Valida permisos y actualiza el estado de la tarea
- Modificación en `getStatusText()`: Cambio de "Pendiente" a "Sin empezar"

## Consistencia con el sistema

- Uso del mismo componente `Select` que en asignación de tareas
- Paleta de colores consistente (verde=completada, azul=en progreso, gris=sin empezar)
- Iconos de Lucide React (CheckCircle2, Clock, CircleDashed, AlertCircle, Loader2)
- Clases de Tailwind CSS estandarizadas
- Mensajes en español sin tecnicismos
- Diseño responsivo y minimalista
- Notificaciones toast en posición fija superior derecha

## Archivos modificados

- `/src/app/components/TasksList.tsx`: Lógica y UI de cambio de estado de tareas

## Criterios de aceptación cumplidos

- ✅ **Escenario 1:** Estado por defecto "Sin empezar" al crear tarea
- ✅ **Escenario 2:** Cambio a "En progreso" mediante selector
- ✅ **Escenario 3:** Cambio a "Completada" mediante selector
- ✅ **Escenario 4:** Restricción de modificación solo para responsable
- ✅ **Escenario 5:** Actualización visible para el grupo (intervalo de 3s)
- ✅ **Escenario 6:** Tiempo de respuesta < 3 segundos (800ms)
- ✅ **Escenario 7:** Consistencia de información persistida en localStorage

## Notas adicionales

- Los cambios de estado son **inmediatos** para el usuario que los realiza
- Otros usuarios ven el cambio en **máximo 3 segundos** (sincronización automática)
- No se implementa historial de cambios (según restricciones)
- No se implementa porcentaje de progreso (según restricciones)
- No se implementan comentarios ni subtareas (según restricciones)
- El sistema permite cambiar entre estados en cualquier dirección (no hay flujo forzado)
- Tareas sin asignar no permiten cambio de estado (restricción adicional para evitar inconsistencias)
