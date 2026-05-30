# HU 6.1.2 – Visualizar progreso de la clasificación semanal

## Descripción

Como miembro del grupo familiar, quiero visualizar mi posición y progreso dentro de la clasificación semanal del grupo, para competir con los demás integrantes y mantenerme motivado a completar tareas domésticas.

## Implementación

### Componente principal

`/src/app/components/WeeklyRankingView.tsx`

Integrado en `/src/app/pages/GroupView.tsx` debajo de `TasksList`, visible para todos los miembros del grupo.

### Criterios implementados

| Escenario | Estado | Detalle |
|-----------|--------|---------|
| 1. Visualización de clasificación | ✅ | Ranking con trofeos, insignias, pódium visual para top 3 |
| 2. Actualización automática | ✅ | Intervalo de 1800ms (< 2s), puntos recalculados al completar tareas |
| 3. Historial de puntos | ✅ | Tab "Mis puntos" con lista de tareas completadas y pts ganados |
| 4. Finalización automática | ✅ | Detecta fecha límite o meta alcanzada, declara ganador con trofeo |
| 5. Tiempo de actualización | ✅ | Refresh cada 1.8 segundos |
| 6. Disponibilidad | ✅ | Estado de carga, clasificación activa, finalizada y sin clasificación |

### Lógica de puntos

- Fuente: `localStorage.familyTasks` (tareas con `status === "completed"` y `groupId` correcto)
- Filtro: tareas cuyo `createdAt >= ranking.createdAt` (dentro del período de la clasificación)
- Cálculo: `completedTasks.length × ranking.pointsPerTask`

### Estados visuales

1. **Loading** – spinner centrado con texto "Cargando clasificación..."
2. **Sin clasificación activa** – icono vacío + mensaje orientativo
3. **Clasificación activa** – pódium top 3 + lista completa + mi progreso + tabs (Ranking / Mis puntos)
4. **Clasificación finalizada** – card dorada con ganador, trofeo, ranking final, bloqueo de acumulación

### Gamificación

- **Pódium** visual con barras de altura para 1°, 2°, 3° lugar
- **Iconos**: `Crown` (1°), `Medal` gris (2°), `Medal` ámbar (3°)
- **Progress bar** por miembro y para el usuario actual
- **Badge** de posición (`#1° lugar`)
- **Trofeos** en estado finalizado
- Colores diferenciados: amarillo/naranja (1°), gris (2°), ámbar (3°), morado (usuario actual)

### Historial de puntos

Tab "Mis puntos" muestra lista individual con:
- Nombre de la tarea completada
- Fecha de creación
- Puntos obtenidos (`+N pts`)

### Finalización

- Condición: `Date.now() > ranking.endDate` OR `algún miembro alcanza weeklyGoal`
- Acción: marca `active: false` en `localStorage.weeklyRankings`
- UI: card dorada, anuncio de ganador, trofeos, mensaje de bloqueo

## Estructura de datos

```ts
// localStorage: "weeklyRankings"
interface WeeklyRanking {
  id: string;
  groupId: string;
  pointsPerTask: number;
  weeklyGoal: number;
  startDate: number;
  endDate: number;
  active: boolean;
  createdAt: number;
}

// localStorage: "familyTasks"
interface Task {
  id: string;
  groupId: string;
  name: string;
  assignedTo?: string;
  status: "pending" | "in_progress" | "completed";
  createdAt: number;
}
```

## Consideraciones técnicas

- No requiere backend ni base de datos real
- Compatible con React + Tailwind CSS
- Componentes reutilizables: `Card`, `Progress`, `Badge`
- Diseño responsivo con grid y flex
- Sin animaciones excesivas, estilo limpio y minimalista
- Coherente con colores `purple-600` y `blue-500` del sistema
