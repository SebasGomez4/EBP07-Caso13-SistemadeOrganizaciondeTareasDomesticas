# HU 6.2.1 – Crear clasificación semanal

## Resumen de implementación

Este documento describe la implementación de la funcionalidad de creación de clasificación semanal según los criterios de aceptación de la Historia de Usuario 6.2.1.

## Descripción

Como administrador de un grupo familiar, quiero poder crear una clasificación semanal basada en puntos obtenidos del cumplimiento de las tareas domésticas, para incentivar la participación, los buenos hábitos y una sana competencia dentro de los miembros del grupo familiar.

## Componentes creados

### WeeklyRankingForm (`/src/app/components/WeeklyRankingForm.tsx`)

Nuevo componente que proporciona un formulario simple para que los administradores creen y configuren clasificaciones semanales dentro de sus grupos familiares.

## Pantalla modificada

### GroupView (`/src/app/pages/GroupView.tsx`)

Se integró el componente `WeeklyRankingForm` en la vista del grupo, ubicado después de la sección de creación de tareas y antes de la sección de abandonar grupo.

## Funcionalidades implementadas

### Escenario 1: Creación exitosa

**Implementación:**
- Formulario con dos campos obligatorios:
  - **Puntos por tarea completada**: Input numérico (1-1000)
  - **Meta semanal de puntos**: Input numérico (1-10000)
- Validación de campos antes de enviar
- Al confirmar:
  1. Se crea un registro de clasificación con ID único
  2. Se calcula automáticamente el rango de la semana actual (lunes a domingo)
  3. Se marca como `active: true`
  4. Se guarda en localStorage bajo la key `weeklyRankings`
  5. Se muestra mensaje de éxito

**Código de creación:**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Validaciones...

  setIsCreating(true);

  setTimeout(() => {
    const now = Date.now();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const newRanking: WeeklyRanking = {
      id: `ranking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      groupId: groupId,
      pointsPerTask: parseInt(pointsPerTask, 10),
      weeklyGoal: parseInt(weeklyGoal, 10),
      startDate: startOfWeek.getTime(),
      endDate: endOfWeek.getTime(),
      active: true,
      createdAt: now,
    };

    const rankings: WeeklyRanking[] = JSON.parse(
      localStorage.getItem("weeklyRankings") || "[]"
    );
    rankings.push(newRanking);
    localStorage.setItem("weeklyRankings", JSON.stringify(rankings));

    setActiveRanking(newRanking);
    setIsCreating(false);
    setShowSuccess(true);

    // Limpiar formulario
    setPointsPerTask("");
    setWeeklyGoal("");

    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  }, 1200);
};
```

**Mensaje de éxito:**
```typescript
{showSuccess && (
  <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
    <div>
      <p className="text-sm font-medium text-gray-900">Clasificación creada exitosamente</p>
      <p className="text-xs text-gray-600 mt-0.5">
        La clasificación semanal ha sido configurada correctamente
      </p>
    </div>
  </div>
)}
```

### Escenario 2: Restricción de múltiples clasificaciones activas

**Implementación:**
- Al cargar el componente, se verifica si existe una clasificación activa para el grupo
- Si existe:
  - Se muestra un `Alert` azul indicando que ya hay una clasificación activa
  - Se muestran los valores configurados (puntos por tarea y meta semanal)
  - Los campos del formulario se deshabilitan
  - El botón de crear se deshabilita
  - Si el usuario intenta enviar el formulario, se muestra notificación de restricción

**Código de verificación:**
```typescript
useEffect(() => {
  // Verificar si ya existe una clasificación activa para este grupo
  const rankings: WeeklyRanking[] = JSON.parse(
    localStorage.getItem("weeklyRankings") || "[]"
  );
  const active = rankings.find((r) => r.groupId === groupId && r.active);
  setActiveRanking(active || null);
}, [groupId]);
```

**Validación en submit:**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Escenario 2: Restricción de múltiples clasificaciones activas
  if (activeRanking) {
    setShowActiveWarning(true);
    setTimeout(() => {
      setShowActiveWarning(false);
    }, 5000);
    return;
  }

  // Continuar con creación...
};
```

**Alert de clasificación activa:**
```typescript
{activeRanking && (
  <Alert variant="default" className="border-blue-200 bg-blue-50 mb-5">
    <AlertCircle className="h-4 w-4 text-blue-600" />
    <AlertDescription className="text-blue-900">
      <span className="font-medium">Ya existe una clasificación semanal activa</span>
      <div className="text-sm text-blue-700 mt-1">
        Puntos por tarea: <span className="font-medium">{activeRanking.pointsPerTask}</span> ·
        Meta semanal: <span className="font-medium">{activeRanking.weeklyGoal} puntos</span>
      </div>
    </AlertDescription>
  </Alert>
)}
```

**Mensaje de restricción:**
```typescript
{showActiveWarning && (
  <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-orange-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
    <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
    <div>
      <p className="text-sm font-medium text-gray-900">Ya existe una clasificación activa</p>
      <p className="text-xs text-gray-600 mt-0.5">
        No se pueden crear múltiples clasificaciones semanales activas
      </p>
    </div>
  </div>
)}
```

### Escenario 3: Tiempo de respuesta

**Implementación:**
- Operación simulada con `setTimeout` de 1200ms (1.2 segundos)
- Cumple con el requisito de < 3 segundos
- Durante la creación:
  - Campos del formulario se deshabilitan
  - Botón muestra texto "Creando clasificación..." con spinner
- Al completar:
  - Mensaje de éxito durante 5 segundos
  - Formulario se limpia automáticamente

**Código del tiempo de respuesta:**
```typescript
setIsCreating(true);

setTimeout(() => {
  // Crear y guardar clasificación
  // ...

  setIsCreating(false);
  setShowSuccess(true);

  // Limpiar formulario
  setPointsPerTask("");
  setWeeklyGoal("");

  setTimeout(() => {
    setShowSuccess(false);
  }, 5000);
}, 1200); // Simular 1.2 segundos
```

**Botón con estado de loading:**
```typescript
<Button
  type="submit"
  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto"
  disabled={isCreating || !!activeRanking}
>
  {isCreating ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Creando clasificación...
    </>
  ) : (
    <>
      <Trophy className="h-4 w-4 mr-2" />
      Crear clasificación semanal
    </>
  )}
</Button>
```

### Escenario 4: Disponibilidad

**Implementación:**
- El componente está integrado en la vista del grupo (`GroupView.tsx`)
- Solo visible para usuarios con rol "Administrador"
- Renderizado condicional basado en `currentUserRole`
- Si el usuario no es administrador, el componente retorna `null` y no se muestra

**Código de restricción de acceso:**
```typescript
export function WeeklyRankingForm({ groupId, currentUserRole }: WeeklyRankingFormProps) {
  // Solo administradores pueden ver este componente
  if (currentUserRole !== "Administrador") {
    return null;
  }

  // Resto del componente...
}
```

**Integración en GroupView:**
```typescript
{/* ── Clasificación semanal (HU 6.2.1) ── Solo administradores */}
<WeeklyRankingForm groupId={groupId || ""} currentUserRole={userRole} />
```

## Estructura de datos

### Interface WeeklyRanking

```typescript
interface WeeklyRanking {
  id: string;              // ID único de la clasificación
  groupId: string;         // ID del grupo familiar
  pointsPerTask: number;   // Puntos otorgados por tarea completada
  weeklyGoal: number;      // Meta semanal de puntos
  startDate: number;       // Inicio de la semana (timestamp)
  endDate: number;         // Fin de la semana (timestamp)
  active: boolean;         // Si la clasificación está activa
  createdAt: number;       // Fecha de creación (timestamp)
}
```

### Ejemplo de registro en localStorage

```json
{
  "id": "ranking-1715963456789-abc123",
  "groupId": "group-xyz",
  "pointsPerTask": 10,
  "weeklyGoal": 100,
  "startDate": 1715558400000,
  "endDate": 1716163199999,
  "active": true,
  "createdAt": 1715963456789
}
```

### Cálculo de semana

La semana se calcula automáticamente desde el lunes 00:00:00 hasta el domingo 23:59:59:

```typescript
const today = new Date();
const dayOfWeek = today.getDay();
const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() + diffToMonday);
startOfWeek.setHours(0, 0, 0, 0);

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6);
endOfWeek.setHours(23, 59, 59, 999);
```

## Validaciones implementadas

### Puntos por tarea completada

```typescript
const validatePointsPerTask = (value: string): string | null => {
  if (!value.trim()) {
    return "Los puntos por tarea son obligatorios";
  }

  const numValue = parseInt(value, 10);
  if (isNaN(numValue) || numValue <= 0) {
    return "Debe ser un número mayor a 0";
  }

  if (numValue > 1000) {
    return "El máximo de puntos por tarea es 1000";
  }

  return null;
};
```

**Reglas:**
- Campo obligatorio
- Debe ser un número entero
- Valor mínimo: 1
- Valor máximo: 1000

### Meta semanal de puntos

```typescript
const validateWeeklyGoal = (value: string): string | null => {
  if (!value.trim()) {
    return "La meta semanal es obligatoria";
  }

  const numValue = parseInt(value, 10);
  if (isNaN(numValue) || numValue <= 0) {
    return "Debe ser un número mayor a 0";
  }

  if (numValue > 10000) {
    return "El máximo de meta semanal es 10000";
  }

  return null;
};
```

**Reglas:**
- Campo obligatorio
- Debe ser un número entero
- Valor mínimo: 1
- Valor máximo: 10000

## Elementos visuales

### Formulario de creación

```typescript
<Card className="shadow-sm border-purple-100">
  <CardHeader>
    <CardTitle className="text-xl flex items-center gap-2">
      <Trophy className="h-5 w-5 text-purple-500" />
      Clasificación semanal
    </CardTitle>
    <CardDescription>
      Configura la clasificación semanal para incentivar la participación del grupo
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Alert de clasificación activa (condicional) */}
    
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Campo: Puntos por tarea completada */}
      {/* Campo: Meta semanal de puntos */}
      {/* Botón de creación */}
    </form>
  </CardContent>
</Card>
```

### Campos del formulario

**Puntos por tarea completada:**
```typescript
<div className="space-y-2">
  <Label htmlFor="pointsPerTask">
    Puntos por tarea completada <span className="text-red-500">*</span>
  </Label>
  <Input
    id="pointsPerTask"
    type="number"
    min="1"
    max="1000"
    value={pointsPerTask}
    onChange={(e) => {
      setPointsPerTask(e.target.value);
      if (errors.pointsPerTask) {
        setErrors({ ...errors, pointsPerTask: undefined });
      }
    }}
    placeholder="Ej: 10"
    className={errors.pointsPerTask ? "border-red-500 focus-visible:ring-red-200" : ""}
    disabled={isCreating || !!activeRanking}
  />
  {errors.pointsPerTask && (
    <p className="text-sm text-red-600 flex items-start gap-1.5">
      <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-1.5"></span>
      {errors.pointsPerTask}
    </p>
  )}
  <p className="text-xs text-gray-500">
    Cantidad de puntos que se otorgarán por cada tarea completada
  </p>
</div>
```

**Meta semanal de puntos:**
```typescript
<div className="space-y-2">
  <Label htmlFor="weeklyGoal">
    Meta semanal de puntos <span className="text-red-500">*</span>
  </Label>
  <Input
    id="weeklyGoal"
    type="number"
    min="1"
    max="10000"
    value={weeklyGoal}
    onChange={(e) => {
      setWeeklyGoal(e.target.value);
      if (errors.weeklyGoal) {
        setErrors({ ...errors, weeklyGoal: undefined });
      }
    }}
    placeholder="Ej: 100"
    className={errors.weeklyGoal ? "border-red-500 focus-visible:ring-red-200" : ""}
    disabled={isCreating || !!activeRanking}
  />
  {errors.weeklyGoal && (
    <p className="text-sm text-red-600 flex items-start gap-1.5">
      <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-1.5"></span>
      {errors.weeklyGoal}
    </p>
  )}
  <p className="text-xs text-gray-500">
    Objetivo de puntos que los miembros deben alcanzar semanalmente
  </p>
</div>
```

## Estilos aplicados

### Card principal
- `shadow-sm border-purple-100`: Sombra sutil y borde morado
- Consistente con otras tarjetas del sistema

### Alert de clasificación activa
- `border-blue-200 bg-blue-50`: Fondo y borde azul claro
- `text-blue-900`: Texto principal azul oscuro
- `text-blue-700`: Texto secundario azul medio

### Inputs
- `type="number" min="1" max="..."`: Validación HTML nativa
- `border-red-500 focus-visible:ring-red-200`: Estado de error
- `disabled:opacity-50`: Estado deshabilitado

### Botón de creación
- `bg-gradient-to-r from-purple-600 to-blue-600`: Gradiente morado-azul
- `hover:from-purple-700 hover:to-blue-700`: Hover más oscuro
- `w-full sm:w-auto`: Ancho completo en móvil, automático en desktop

### Notificaciones toast
- `fixed top-4 right-4 z-50`: Posición fija superior derecha
- `shadow-lg rounded-lg`: Sombra y bordes redondeados
- `border-green-200` (éxito) o `border-orange-200` (advertencia)

## Estados del componente

```typescript
const [pointsPerTask, setPointsPerTask] = useState("");
const [weeklyGoal, setWeeklyGoal] = useState("");
const [errors, setErrors] = useState<{ pointsPerTask?: string; weeklyGoal?: string }>({});
const [isCreating, setIsCreating] = useState(false);
const [showSuccess, setShowSuccess] = useState(false);
const [activeRanking, setActiveRanking] = useState<WeeklyRanking | null>(null);
const [showActiveWarning, setShowActiveWarning] = useState(false);
```

## Flujo completo de creación

1. **Administrador** accede a la vista del grupo
2. Ve el componente "Clasificación semanal"
3. Verifica si hay una clasificación activa:
   - **Si hay clasificación activa:**
     - Ve alert azul con información de la clasificación
     - Campos deshabilitados
     - Botón deshabilitado
     - No puede crear nueva clasificación
   - **Si NO hay clasificación activa:**
     - Ve formulario habilitado
     - Completa los campos:
       - Puntos por tarea completada (1-1000)
       - Meta semanal de puntos (1-10000)
     - Hace clic en "Crear clasificación semanal"
4. Sistema valida los campos:
   - **Si hay errores:** Muestra mensajes de error bajo cada campo
   - **Si es válido:** Continúa al paso 5
5. Botón muestra "Creando clasificación..." con spinner
6. Después de 1.2 segundos:
   - Se crea el registro de clasificación
   - Se calcula la semana actual (lunes a domingo)
   - Se guarda en localStorage
   - Se muestra notificación de éxito
   - Formulario se limpia
7. La clasificación queda activa y visible en el alert azul
8. El administrador puede ver la configuración pero no puede crear otra

## Integración con el sistema

### Ubicación en la vista del grupo

La clasificación semanal se ubica después de la creación de tareas y antes de las opciones de abandonar/eliminar grupo:

```
1. Gestión de miembros
2. Lista de miembros
3. Lista de tareas
4. Crear nueva tarea
5. Clasificación semanal ← NUEVA SECCIÓN
6. Abandonar grupo
7. Eliminar grupo (solo admin)
```

### Permisos

| Rol | Puede ver | Puede crear |
|-----|-----------|-------------|
| Administrador | ✅ | ✅ |
| Coadministrador | ❌ | ❌ |
| Colaborador | ❌ | ❌ |

## Estado de localStorage

### Key utilizada
- `weeklyRankings`: Array de todas las clasificaciones semanales

### Ejemplo de estado completo

```json
[
  {
    "id": "ranking-1715963456789-abc123",
    "groupId": "group-xyz",
    "pointsPerTask": 10,
    "weeklyGoal": 100,
    "startDate": 1715558400000,
    "endDate": 1716163199999,
    "active": true,
    "createdAt": 1715963456789
  },
  {
    "id": "ranking-1715800000000-def456",
    "groupId": "group-abc",
    "pointsPerTask": 15,
    "weeklyGoal": 150,
    "startDate": 1715558400000,
    "endDate": 1716163199999,
    "active": true,
    "createdAt": 1715800000000
  }
]
```

## Archivos creados

- `/src/app/components/WeeklyRankingForm.tsx`: Componente de formulario de clasificación semanal

## Archivos modificados

- `/src/app/pages/GroupView.tsx`: Integración del componente en la vista del grupo

## Importaciones agregadas en GroupView

```typescript
import { WeeklyRankingForm } from "../components/WeeklyRankingForm";
```

## Criterios de aceptación cumplidos

- ✅ **Escenario 1:** Creación exitosa con puntos y meta configurables
- ✅ **Escenario 2:** Restricción de múltiples clasificaciones activas
- ✅ **Escenario 3:** Tiempo de respuesta < 3 segundos (1.2s)
- ✅ **Escenario 4:** Disponibilidad solo para administradores

## Restricciones cumplidas

- ✅ No se implementó visualización de leaderboard
- ✅ No se implementó ranking visual
- ✅ No se implementaron estadísticas avanzadas
- ✅ No se implementaron gráficos
- ✅ No se implementó historial semanal
- ✅ No se implementaron recompensas
- ✅ Solo se implementó la creación/configuración
- ✅ No se inventaron reglas de puntuación adicionales

## Notas adicionales

- La clasificación se crea para la **semana actual** (lunes a domingo)
- Solo puede haber **una clasificación activa** por grupo
- No se implementa visualización de rankings (pertenece a otra HU)
- No se implementa cálculo automático de puntos (pertenece a otra HU)
- Los puntos y la meta son solo configuración, no se usan en esta HU
- El componente es completamente **funcional** pero la lógica de puntuación se implementará en HUs posteriores
- La restricción de clasificación activa se basa en el campo `active: true`
- Usuarios no administradores **no ven** esta sección en absoluto
