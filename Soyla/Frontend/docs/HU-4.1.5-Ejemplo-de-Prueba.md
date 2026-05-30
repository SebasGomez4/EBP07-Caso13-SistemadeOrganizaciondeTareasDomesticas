# HU 4.1.5 – Ejemplo de Prueba

## Escenario de prueba: Detección de tareas vencidas

### Datos de prueba en localStorage

```json
// localStorage.setItem("familyTasks", JSON.stringify([...]))
[
  {
    "id": "task-001",
    "groupId": "group-123",
    "name": "Sacar basura",
    "description": "Sacar la basura al contenedor",
    "deadline": "2026-05-16T23:59:59",  // Ayer (vencida)
    "assignedTo": "carlos@example.com",
    "status": "pending",
    "priority": "alta",
    "createdAt": 1715900000000
  },
  {
    "id": "task-002",
    "groupId": "group-123",
    "name": "Lavar platos",
    "description": "Lavar los platos de la cena",
    "deadline": "2026-05-15T23:59:59",  // Hace 2 días (vencida)
    "assignedTo": "maria@example.com",
    "status": "in_progress",
    "priority": "media",
    "createdAt": 1715800000000
  },
  {
    "id": "task-003",
    "groupId": "group-123",
    "name": "Hacer compras",
    "description": "Ir al supermercado",
    "deadline": "2026-05-14T23:59:59",  // Hace 3 días pero completada
    "assignedTo": "juan@example.com",
    "status": "completed",  // No debe alertar (Escenario 2)
    "priority": "alta",
    "createdAt": 1715700000000
  },
  {
    "id": "task-004",
    "groupId": "group-123",
    "name": "Limpiar baño",
    "description": "Limpieza general del baño",
    "deadline": "2026-05-19T23:59:59",  // Futuro (no vencida)
    "assignedTo": "carlos@example.com",
    "status": "pending",
    "priority": "media",
    "createdAt": 1716000000000
  }
]
```

### Resultado esperado

#### Tareas que DEBEN generar alerta:
1. **"Sacar basura"** (task-001)
   - Responsable: Carlos
   - Vencida: 2026-05-16 (ayer)
   - Estado: pending

2. **"Lavar platos"** (task-002)
   - Responsable: María
   - Vencida: 2026-05-15 (hace 2 días)
   - Estado: in_progress

#### Tareas que NO deben generar alerta:
- **"Hacer compras"** (task-003) → completada a tiempo ✅ Escenario 2
- **"Limpiar baño"** (task-004) → no vencida aún

### Flujo de prueba

#### 1. Carga inicial (< 2 segundos)
```
Usuario "ana@example.com" entra a /grupo/group-123
├─ Carga tareas (600ms)
├─ checkAndCreateOverdueAlerts() detecta 2 tareas vencidas
│  ├─ Crea OverdueAlert para task-001 ("Sacar basura")
│  └─ Crea OverdueAlert para task-002 ("Lavar platos")
├─ Guarda en localStorage.taskOverdueAlerts
└─ checkOverdueAlerts() muestra toast de la más reciente
   └─ Toast rojo: "Tarea vencida (+1 más)"
      ├─ "Lavar platos"
      ├─ María no completó antes de la fecha límite
      └─ Fecha límite: 15 may 2026
```

#### 2. Visualización (< 5 segundos desde carga)
```
Panel de alertas de vencimiento:
├─ Header rojo: "Alertas de vencimiento" + "2 nuevas"
├─ Alerta 1 (punto rojo):
│  ├─ La tarea "Lavar platos" ha vencido
│  ├─ María no completó antes de la fecha límite
│  ├─ Fecha límite: 15 may 2026
│  └─ Badge "Nueva"
└─ Alerta 2 (punto rojo):
   ├─ La tarea "Sacar basura" ha vencido
   ├─ Carlos no completó antes de la fecha límite
   ├─ Fecha límite: 16 may 2026
   └─ Badge "Nueva"
```

#### 3. Carlos completa "Sacar basura" (Escenario 2)
```
Carlos cambia estado a "Completada"
├─ handleStatusChange() actualiza task-001.status = "completed"
├─ Crea CompletionAlert (HU 4.1.4)
└─ Elimina OverdueAlert de task-001
   └─ Panel de vencimiento ahora solo muestra 1 alerta ("Lavar platos")
```

#### 4. Prevención de duplicados (Escenario 4)
```
Polling cada 3s ejecuta checkAndCreateOverdueAlerts()
├─ Detecta task-001 y task-002 como vencidas
├─ Verifica existingAlertTaskIds = ["task-001", "task-002"]
├─ Filtra: newlyOverdue = [] (todas ya tienen alerta)
└─ No crea alertas duplicadas ✅
```

#### 5. Nueva tarea vence en tiempo real
```
Tarea "Limpiar baño" (task-004) alcanza su deadline 2026-05-19
├─ Polling (3s) detecta nueva tarea vencida
├─ checkAndCreateOverdueAlerts() crea OverdueAlert para task-004
├─ Polling (2s) ejecuta checkOverdueAlerts()
└─ Toast rojo aparece en menos de 5 segundos ✅ Escenario 3
   └─ "Tarea vencida"
      ├─ "Limpiar baño"
      ├─ Carlos no completó antes de la fecha límite
      └─ Fecha límite: 19 may 2026
```

### Verificación de criterios

| Criterio | Verificación |
|----------|-------------|
| **Escenario 1** | ✅ Alerta incluye: nombre ("Sacar basura"), responsable (Carlos), fecha límite (16 may 2026) |
| **Escenario 2** | ✅ task-003 completada → no genera alerta. Al completar task-001, se elimina su alerta |
| **Escenario 3** | ✅ Polling 3s + 2s = máx 5s entre vencimiento y alerta |
| **Escenario 4** | ✅ `existingAlertTaskIds` previene duplicados. Solo crea alerta para tareas nuevas vencidas |

### Estados visuales en cards de tareas

```
Card "Sacar basura" (vencida, no completada):
├─ Borde rojo (border-red-300)
├─ Fondo rojo claro (bg-red-50/30)
├─ Badge "Tu tarea está vencida" (rojo) junto al nombre
├─ Icono calendario rojo
└─ Fecha límite en rojo (text-red-700 font-medium)

Card "Hacer compras" (vencida pero completada):
├─ Borde normal (border-purple-100)
├─ Sin resaltado especial
├─ Badge "Completada" (verde)
└─ isTaskOverdue() retorna false por status === "completed"
```

### Datos finales en localStorage

```json
// localStorage.taskOverdueAlerts
[
  {
    "id": "oa-1716000123456-abc123",
    "groupId": "group-123",
    "taskId": "task-002",
    "taskName": "Lavar platos",
    "assignedTo": "maria@example.com",
    "assignedToName": "María García",
    "deadline": "2026-05-15T23:59:59",
    "overdueAt": 1716000123456,
    "seenBy": ["ana@example.com"]
  }
  // task-001 eliminada al completarse
  // task-003 nunca generó alerta (completada a tiempo)
  // task-004 generará alerta cuando venza
]
```

### Comportamiento con múltiples usuarios

```
Usuario Ana (grupo-123):
├─ Ve alertas de vencimiento de task-001 y task-002
├─ Toast rojo al cargar página
└─ Panel muestra 2 alertas marcadas como "Nueva"

Usuario Carlos (grupo-123, responsable de task-001):
├─ Ve mismas alertas que Ana
├─ Completa task-001 → alerta desaparece para todos
├─ Su propio card "Sacar basura" tenía resaltado rojo intenso
└─ Cards de otros (task-002) tenían resaltado rojo suave

Usuario María (grupo-123, responsable de task-002):
├─ Ve alertas de vencimiento
├─ Su propio card "Lavar platos" resaltado rojo intenso
└─ Puede completar tarea para eliminar alerta
```

### Integración con reconexión (HU 4.1.2 Escenario 4)

```
Usuario pierde conexión → recupera conexión
├─ Event "online" dispara handleOnline()
├─ Toast azul: "Conexión restaurada · Sincronizando alertas..."
├─ Ejecuta checkAndCreateOverdueAlerts() y checkOverdueAlerts()
├─ Detecta nuevas alertas de vencimiento creadas mientras estaba offline
└─ Muestra toast rojo con alertas perdidas (< 10 segundos) ✅
```
