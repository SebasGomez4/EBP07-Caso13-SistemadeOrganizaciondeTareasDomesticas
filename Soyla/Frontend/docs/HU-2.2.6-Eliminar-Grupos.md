# HU 2.2.6 – Eliminar grupos familiares

## Resumen de implementación

Este documento describe la implementación de la funcionalidad de eliminación de grupos familiares según los criterios de aceptación de la Historia de Usuario 2.2.6.

## Descripción

Como administrador del grupo quiero la opción de eliminar el grupo familiar para poder dar por finalizadas las actividades relacionadas con dicho grupo.

## Pantalla modificada

### GroupView (`/src/app/pages/GroupView.tsx`)

La vista de detalle del grupo ahora incluye la funcionalidad completa para que los administradores puedan eliminar el grupo de forma segura e irreversible.

## Funcionalidades implementadas

### Escenario 1: Eliminación confirmada

**Implementación:**
- Nueva sección "Eliminar grupo" al final de la vista (solo visible para administradores)
- Card con fondo rojo suave y borde rojo para diferenciarlo visualmente
- Botón "Eliminar grupo" con estilo destructivo (rojo)
- Al confirmar la eliminación:
  1. Se elimina el grupo de la lista global `familyGroups`
  2. Se remueven todos los miembros de `groupMembers[groupId]`
  3. Se eliminan todos los roles de `groupRoles[groupId]`
  4. Se eliminan todas las tareas de `groupTasks[groupId]`
  5. Se eliminan las invitaciones activas de `familyInvites`
  6. Se actualiza localStorage
  7. El administrador es redirigido a `/home`

**Código de la lógica:**
```typescript
const handleConfirmDelete = () => {
  if (!group || userRole !== "Administrador") return;
  
  setDeletingGroup(true);
  
  setTimeout(() => {
    // Eliminar el grupo de la lista global
    const groups: FamilyGroup[] = JSON.parse(
      localStorage.getItem("familyGroups") || "[]"
    );
    const updatedGroups = groups.filter((g) => g.id !== group.id);
    localStorage.setItem("familyGroups", JSON.stringify(updatedGroups));

    // Eliminar todos los miembros del grupo
    const members: Record<string, string[]> = JSON.parse(
      localStorage.getItem("groupMembers") || "{}"
    );
    delete members[group.id];
    localStorage.setItem("groupMembers", JSON.stringify(members));

    // Eliminar todos los roles del grupo
    const groupRoles: Record<string, Record<string, string>> = JSON.parse(
      localStorage.getItem("groupRoles") || "{}"
    );
    delete groupRoles[group.id];
    localStorage.setItem("groupRoles", JSON.stringify(groupRoles));

    // Eliminar todas las tareas del grupo
    const tasks: Record<string, any[]> = JSON.parse(
      localStorage.getItem("groupTasks") || "{}"
    );
    delete tasks[group.id];
    localStorage.setItem("groupTasks", JSON.stringify(tasks));

    // Eliminar invitaciones del grupo
    const invites: InviteRecord[] = JSON.parse(
      localStorage.getItem("familyInvites") || "[]"
    );
    const updatedInvites = invites.filter((i) => i.groupId !== group.id);
    localStorage.setItem("familyInvites", JSON.stringify(updatedInvites));

    setDeletingGroup(false);
    setShowDeleteDialog(false);
    navigate("/home");
  }, 1200);
};
```

### Escenario 2: Cancelación de eliminación

**Implementación:**
- Modal de confirmación con dos botones claramente diferenciados
- Botón "Cancelar" (estilo outline, seguro)
- Si el usuario cancela:
  - El modal se cierra (`setShowDeleteDialog(false)`)
  - No se realiza ningún cambio en localStorage
  - El grupo permanece intacto

**Comportamiento:**
```typescript
<AlertDialogCancel disabled={deletingGroup}>
  Cancelar
</AlertDialogCancel>
```

### Escenario 3: Restricción para usuarios no administradores

**Implementación:**
- Renderizado condicional basado en `userRole`
- Solo usuarios con rol "Administrador" ven la sección de eliminación
- Usuarios "Coadministrador" y "Colaborador" no tienen acceso

**Código de validación:**
```typescript
{userRole === "Administrador" && (
  <Card className="shadow-sm border-red-200 bg-red-50/30">
    <CardContent className="pt-6 pb-6">
      {/* Contenido de eliminación */}
    </CardContent>
  </Card>
)}
```

**Validación adicional en handlers:**
```typescript
const handleDeleteGroupClick = () => {
  if (userRole !== "Administrador") return;
  setShowDeleteDialog(true);
};

const handleConfirmDelete = () => {
  if (!group || userRole !== "Administrador") return;
  // ... lógica de eliminación
};
```

### Escenario 4: Grupo con tareas pendientes

**Implementación:**
- El sistema elimina el grupo junto con todas sus tareas sin validación adicional
- Se eliminan tanto tareas pendientes como completadas
- La eliminación es completa e irreversible

**Datos eliminados:**
```typescript
// Eliminar todas las tareas del grupo
const tasks: Record<string, any[]> = JSON.parse(
  localStorage.getItem("groupTasks") || "{}"
);
delete tasks[group.id];
localStorage.setItem("groupTasks", JSON.stringify(tasks));
```

### Escenario 5: Tiempo de respuesta

**Implementación:**
- Operación simulada con `setTimeout` de 1200ms (1.2 segundos)
- Cumple con el requisito de < 3 segundos
- Durante la eliminación:
  - Botón muestra spinner y texto "Eliminando..."
  - Botón "Cancelar" se deshabilita
- Al finalizar:
  - Redirección automática a `/home`

**Indicador visual:**
```typescript
{deletingGroup ? (
  <span className="flex items-center gap-2">
    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
    Eliminando...
  </span>
) : (
  "Eliminar grupo"
)}
```

### Escenario 6: Claridad y usabilidad

**Implementación:**

**Advertencia en la sección:**
- Card con fondo rojo suave (`bg-red-50/30`)
- Borde rojo (`border-red-200`)
- Título con ícono de advertencia (AlertTriangle)
- Texto destacado: "Esta acción es **irreversible**"

**Modal de confirmación:**
- Título claro: "¿Eliminar grupo '{nombre}'?"
- Alert destacado en rojo con texto: "**Esta acción es irreversible**"
- Lista de elementos que se eliminarán:
  - Todos los miembros del grupo
  - Todas las tareas pendientes y completadas
  - Toda la información asociada al grupo
- Mensaje final: "Esta operación no se puede deshacer"

**Botones:**
- "Cancelar" (visible, seguro, habilitado hasta que comience la eliminación)
- "Eliminar grupo" (destructivo, rojo, con estado de carga)

**Código del modal:**
```typescript
<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <Trash2 className="h-5 w-5 text-red-600" />
        ¿Eliminar grupo "{group?.name}"?
      </AlertDialogTitle>
      <AlertDialogDescription>
        <div className="space-y-3 pt-2">
          <Alert variant="default" className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <span className="font-semibold">Esta acción es irreversible</span>
            </AlertDescription>
          </Alert>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Al eliminar este grupo, se eliminarán permanentemente:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Todos los miembros del grupo</li>
              <li>Todas las tareas pendientes y completadas</li>
              <li>Toda la información asociada al grupo</li>
            </ul>
            <p className="font-medium text-gray-700 pt-1">
              Esta operación no se puede deshacer.
            </p>
          </div>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={deletingGroup}>
        Cancelar
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={handleConfirmDelete}
        disabled={deletingGroup}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        {deletingGroup ? "Eliminando..." : "Eliminar grupo"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Elementos visuales

### Card de eliminación
```typescript
<Card className="shadow-sm border-red-200 bg-red-50/30">
  <CardContent className="pt-6 pb-6">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h3 className="text-base font-medium text-red-900 mb-1 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Eliminar grupo
        </h3>
        <p className="text-sm text-red-700">
          Esta acción es <span className="font-semibold">irreversible</span>. 
          Se eliminarán todos los miembros, tareas e información asociada al grupo.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={handleDeleteGroupClick}
        className="border-red-300 text-red-700 bg-red-50 hover:bg-red-100 
                   hover:text-red-800 hover:border-red-400 flex items-center gap-2 shrink-0"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar grupo
      </Button>
    </div>
  </CardContent>
</Card>
```

### Estilos aplicados
- **Card principal:**
  - `border-red-200`: Borde rojo suave
  - `bg-red-50/30`: Fondo rojo muy transparente
  - `shadow-sm`: Sombra sutil
  
- **Botón "Eliminar grupo":**
  - `border-red-300`: Borde rojo más visible
  - `text-red-700`: Texto rojo oscuro
  - `bg-red-50`: Fondo rojo claro
  - `hover:bg-red-100`: Hover más intenso
  - `hover:text-red-800`: Texto más oscuro en hover
  - `hover:border-red-400`: Borde más intenso en hover

- **Alert de advertencia:**
  - `border-red-200`: Borde rojo
  - `bg-red-50`: Fondo rojo claro
  - `text-red-900`: Texto rojo muy oscuro
  - `font-semibold`: Énfasis en "irreversible"

## Estado de localStorage

### Datos eliminados
Al ejecutar la eliminación, se remueven los siguientes registros:

1. **familyGroups**: El objeto del grupo
2. **groupMembers[groupId]**: Todos los miembros
3. **groupRoles[groupId]**: Todos los roles
4. **groupTasks[groupId]**: Todas las tareas
5. **familyInvites**: Invitaciones relacionadas con el grupo

### Ejemplo de transformación
**Antes de eliminar:**
```json
{
  "familyGroups": [
    { "id": "abc123", "name": "Mi Familia", "createdBy": "user@example.com", "createdAt": 1715963000000 }
  ],
  "groupMembers": {
    "abc123": ["user@example.com", "member@example.com"]
  },
  "groupRoles": {
    "abc123": {
      "user@example.com": "Administrador",
      "member@example.com": "Colaborador"
    }
  },
  "groupTasks": {
    "abc123": [
      { "id": "task1", "title": "Limpiar cocina", "status": "pending" }
    ]
  },
  "familyInvites": [
    { "code": "ABC123XYZ", "groupId": "abc123", "expiresAt": 1716000000000 }
  ]
}
```

**Después de eliminar:**
```json
{
  "familyGroups": [],
  "groupMembers": {},
  "groupRoles": {},
  "groupTasks": {},
  "familyInvites": []
}
```

## Validaciones de seguridad

1. **Validación de rol:** Solo administradores pueden eliminar grupos
2. **Validación de existencia:** Se verifica que el grupo exista antes de eliminar
3. **Renderizado condicional:** La sección solo es visible para administradores
4. **Confirmación obligatoria:** No se puede eliminar sin confirmar en el modal
5. **Protección durante proceso:** Botones deshabilitados durante la eliminación

## Flujo completo de eliminación

1. **Usuario administrador** visualiza la sección "Eliminar grupo"
2. Hace clic en botón "Eliminar grupo"
3. Se abre modal de confirmación con advertencia clara
4. Lee la advertencia de que la acción es irreversible
5. Tiene dos opciones:
   - **Cancelar:** Cierra el modal sin cambios
   - **Eliminar grupo:** Procede con la eliminación
6. Si confirma:
   - Botón muestra estado "Eliminando..." con spinner
   - Se eliminan todos los datos del grupo (1.2 segundos)
   - Redirección automática a `/home`
7. En `/home`, el grupo ya no aparece en la lista

## Consistencia con el sistema

- Uso del mismo componente `AlertDialog` que en "Abandonar grupo"
- Paleta de colores consistente (rojo para acciones destructivas)
- Iconos de Lucide React (Trash2, AlertTriangle)
- Clases de Tailwind CSS estandarizadas
- Mensajes en español sin tecnicismos
- Diseño responsivo con diseño minimalista y limpio

## Archivos modificados

- `/src/app/pages/GroupView.tsx`: Lógica y UI de eliminación de grupos

## Importaciones agregadas

```typescript
import { Trash2 } from "lucide-react";
```

## Estados agregados

```typescript
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [deletingGroup, setDeletingGroup] = useState(false);
```

## Funciones agregadas

- `handleDeleteGroupClick()`: Abre el modal de confirmación (solo admins)
- `handleConfirmDelete()`: Ejecuta la eliminación completa del grupo

## Criterios de aceptación cumplidos

- ✅ **Escenario 1:** Eliminación confirmada elimina grupo y remueve acceso de miembros
- ✅ **Escenario 2:** Cancelación no realiza cambios y mantiene grupo intacto
- ✅ **Escenario 3:** Solo administradores pueden ver y ejecutar la eliminación
- ✅ **Escenario 4:** Se eliminan tareas pendientes junto con el grupo
- ✅ **Escenario 5:** Operación completa en < 3 segundos (1.2s) con confirmación visual
- ✅ **Escenario 6:** Mensaje claro, advertencia destacada, botones diferenciados

## Notas adicionales

- La eliminación es **completamente irreversible** (no hay papelera ni recuperación)
- No se implementa archivado ni eliminación parcial (según restricciones)
- No se inventan nuevos permisos o roles (según restricciones)
- La funcionalidad se integra de forma natural en la vista existente
- Usuarios no administradores no pueden ver ni acceder a esta opción
