# HU 2.2.4 – Abandonar grupos familiares

## Resumen de implementación

Este documento describe la implementación de la funcionalidad de abandonar grupos familiares según los criterios de aceptación de la Historia de Usuario 2.2.4.

## Descripción

Como usuario quiero la opción de abandonar un grupo familiar para poder dejar de participar en sus actividades.

## Pantalla modificada

### GroupView (`/src/app/pages/GroupView.tsx`)

La vista de detalle del grupo ahora incluye la funcionalidad completa para abandonar el grupo de forma segura.

## Funcionalidades implementadas

### Escenario 1: Usuario abandona un grupo

**Implementación:**
- Nueva sección "Abandonar grupo" al final de la vista del grupo
- Botón "Abandonar" con estilo diferenciado (borde y texto rojo)
- Al confirmar el abandono:
  1. Se remueve el email del usuario de `groupMembers[groupId]`
  2. Se elimina el rol del usuario de `groupRoles[groupId][userEmail]`
  3. Se actualiza localStorage
  4. El usuario es redirigido a `/home`
  5. El grupo desaparece automáticamente de la lista (ya no es miembro)

**Código de la lógica:**
```typescript
const handleConfirmLeave = () => {
  if (isOnlyAdmin || !group) return;
  
  setLeavingGroup(true);
  
  setTimeout(() => {
    // Remover usuario de miembros
    const members = JSON.parse(localStorage.getItem("groupMembers") || "{}");
    const groupMembers = members[group.id] || [];
    const updatedMembers = groupMembers.filter(email => email !== userEmail);
    members[group.id] = updatedMembers;
    localStorage.setItem("groupMembers", JSON.stringify(members));
    
    // Remover rol del usuario
    const groupRoles = JSON.parse(localStorage.getItem("groupRoles") || "{}");
    if (groupRoles[group.id]?.[userEmail]) {
      delete groupRoles[group.id][userEmail];
      localStorage.setItem("groupRoles", JSON.stringify(groupRoles));
    }
    
    navigate("/home");
  }, 800);
};
```

### Escenario 2: Restricción para administrador único

**Implementación:**
- Función `checkIfOnlyAdmin()` que verifica si el usuario es el único administrador
- Cuenta el número total de administradores en `groupRoles[groupId]`
- Si el usuario es administrador Y es el único (count === 1), retorna `true`

**Comportamiento visual:**
- Si `isOnlyAdmin === true`:
  - El modal muestra título: "No puedes abandonar el grupo"
  - Ícono de alerta (AlertTriangle en naranja)
  - Alert destacado en naranja: "Debes transferir la administración antes de abandonar el grupo"
  - Texto explicativo claro sin detalles técnicos
  - Solo botón "Entendido" (no hay opción de confirmar)

**Código de validación:**
```typescript
const checkIfOnlyAdmin = (): boolean => {
  if (!group) return false;
  
  const groupRoles = JSON.parse(localStorage.getItem("groupRoles") || "{}");
  const rolesInGroup = groupRoles[group.id] || {};
  
  // Contar administradores
  const adminCount = Object.values(rolesInGroup).filter(
    role => role === "Administrador"
  ).length;
  
  // Usuario es admin Y es el único
  return rolesInGroup[userEmail] === "Administrador" && adminCount === 1;
};
```

### Escenario 3: Confirmación de salida

**Implementación:**
- Se usa el componente `AlertDialog` del sistema de diseño
- Modal con dos estados diferenciados:
  1. **Estado de restricción** (único admin)
  2. **Estado de confirmación** (usuario normal o no único admin)

**Modal de confirmación (usuario normal):**
- **Título**: "¿Deseas abandonar este grupo?"
- **Ícono**: UserMinus en gris
- **Descripción**:
  - Menciona el nombre del grupo entre comillas
  - Explica consecuencias: "perderás acceso a todas sus tareas y actividades"
  - Indica: "Esta acción afectará tu participación en el grupo"
- **Botones**:
  - "Cancelar" (outline, gris) → cierra modal sin hacer nada
  - "Sí, abandonar grupo" (rojo) → ejecuta la acción

**Modal de restricción (único admin):**
- **Título**: "No puedes abandonar el grupo"
- **Ícono**: AlertTriangle en naranja
- **Alert destacado**: Fondo naranja con mensaje claro
- **Explicación**: Sin términos técnicos, lenguaje claro
- **Botón**: Solo "Entendido" → cierra el modal

**Diseño del modal:**
```tsx
<AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        {isOnlyAdmin ? "No puedes..." : "¿Deseas..."}
      </AlertDialogTitle>
      <AlertDialogDescription>
        {isOnlyAdmin ? <RestricciónUI /> : <ConfirmaciónUI />}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      {isOnlyAdmin ? <Entendido /> : <Cancelar y Confirmar />}
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Escenario 4: Tiempo de respuesta

**Implementación:**
- Operación completada en 800ms (< 2 segundos requeridos)
- Estado de carga visual: botón muestra "Abandonando..." mientras procesa
- Botones deshabilitados durante el procesamiento
- Actualización inmediata: redirección a `/home` donde el grupo ya no aparece

**Estados visuales:**
```typescript
const [leavingGroup, setLeavingGroup] = useState(false);

// Durante el proceso:
<AlertDialogAction disabled={leavingGroup}>
  {leavingGroup ? "Abandonando..." : "Sí, abandonar grupo"}
</AlertDialogAction>
```

## Elementos visuales implementados

### Sección "Abandonar grupo"

**Ubicación:** Al final de la vista del grupo, después de la card "Crear nueva tarea"

**Diseño:**
```tsx
<Card className="shadow-sm border-gray-200">
  <CardContent className="pt-6 pb-6">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h3>Abandonar grupo</h3>
        <p>Si abandonas este grupo, dejarás de tener acceso...</p>
      </div>
      <Button 
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50..."
      >
        <UserMinus /> Abandonar
      </Button>
    </div>
  </CardContent>
</Card>
```

**Características:**
- Card con borde gris (no purple) para diferenciarla del resto
- Título claro: "Abandonar grupo"
- Descripción breve de las consecuencias
- Botón con estilo de advertencia:
  - Borde rojo claro: `border-red-200`
  - Texto rojo: `text-red-600`
  - Hover rojo más intenso: `hover:bg-red-50 hover:text-red-700`
  - Ícono UserMinus para indicar la acción

### Estados del AlertDialog

#### Estado 1: Confirmación normal
- Fondo blanco, diseño limpio
- Título con ícono UserMinus gris
- Texto descriptivo en dos párrafos
- Dos botones: Cancelar (gris) y Confirmar (rojo)

#### Estado 2: Restricción (único admin)
- Fondo blanco con alert naranja destacado
- Título con ícono AlertTriangle naranja
- Alert component con:
  - Border naranja: `border-orange-200`
  - Fondo naranja suave: `bg-orange-50`
  - Texto naranja oscuro: `text-orange-900`
- Solo botón "Entendido"

### Íconos utilizados

| Ícono | Uso | Color |
|-------|-----|-------|
| `UserMinus` | Botón abandonar + título confirmación | Rojo / Gris |
| `AlertTriangle` | Título restricción + alert | Naranja |

## Flujo de usuario

### Flujo normal (no es único admin)

```
1. Usuario está en GroupView
2. Hace scroll hasta "Abandonar grupo"
3. Click en botón "Abandonar"
4. Modal se abre con confirmación
5. Usuario lee consecuencias
6. Opciones:
   a) Click "Cancelar" → modal se cierra, nada cambia
   b) Click "Sí, abandonar grupo" → proceso inicia
7. Botón muestra "Abandonando..."
8. Tras 800ms:
   - Usuario removido de miembros
   - Rol eliminado
   - Navegación a /home
9. En /home, el grupo ya no aparece en la lista
```

### Flujo de restricción (único admin)

```
1. Usuario (único admin) está en GroupView
2. Hace scroll hasta "Abandonar grupo"
3. Click en botón "Abandonar"
4. Sistema detecta que es único admin
5. Modal se abre con restricción
6. Usuario ve:
   - Alert naranja destacado
   - Mensaje claro: "Debes transferir la administración..."
   - Explicación adicional
7. Click "Entendido" → modal se cierra
8. Usuario permanece en el grupo
```

## Validaciones implementadas

### 1. Verificación de único administrador
```typescript
// Cuenta administradores en el grupo
const adminCount = Object.values(rolesInGroup).filter(
  role => role === "Administrador"
).length;

// Verifica si usuario es admin Y es el único
return rolesInGroup[userEmail] === "Administrador" && adminCount === 1;
```

### 2. Prevención de abandono durante procesamiento
```typescript
<AlertDialogCancel disabled={leavingGroup}>
  Cancelar
</AlertDialogCancel>
```

### 3. Validación de existencia de grupo
```typescript
const handleConfirmLeave = () => {
  if (isOnlyAdmin || !group) return;
  // ...
};
```

## Actualizaciones de datos

### localStorage keys modificadas

| Key | Modificación | Propósito |
|-----|-------------|-----------|
| `groupMembers` | Remueve email del array del grupo | Usuario deja de ser miembro |
| `groupRoles` | Elimina entrada del usuario | Usuario pierde su rol |

### Ejemplo de actualización

**Antes de abandonar:**
```json
{
  "groupMembers": {
    "group_123": ["user1@example.com", "user2@example.com"]
  },
  "groupRoles": {
    "group_123": {
      "user1@example.com": "Administrador",
      "user2@example.com": "Colaborador"
    }
  }
}
```

**Después de abandonar (user2 abandona):**
```json
{
  "groupMembers": {
    "group_123": ["user1@example.com"]
  },
  "groupRoles": {
    "group_123": {
      "user1@example.com": "Administrador"
    }
  }
}
```

## Componentes UI utilizados

### Nuevos imports agregados
```typescript
import { UserMinus, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
```

### Estados agregados
```typescript
const [showLeaveDialog, setShowLeaveDialog] = useState(false);
const [isOnlyAdmin, setIsOnlyAdmin] = useState(false);
const [leavingGroup, setLeavingGroup] = useState(false);
```

### Funciones agregadas
```typescript
checkIfOnlyAdmin(): boolean         // Valida si es único admin
handleLeaveGroupClick(): void       // Abre modal con validación
handleConfirmLeave(): void          // Procesa el abandono
```

## Restricciones respetadas

✓ No se implementó transferencia completa de administración  
✓ No se agregó eliminación de grupos  
✓ No se agregó gestión avanzada de permisos  
✓ No se inventaron nuevos roles  
✓ No se modificó el flujo de navegación existente  
✓ No se rediseñaron otras pantallas  
✓ Acción limitada estrictamente a abandonar grupo  

## Coherencia con el sistema

### Colores y estilos
- Botón rojo para acción destructiva: `text-red-600`, `hover:bg-red-50`
- Alert naranja para advertencias: `bg-orange-50`, `border-orange-200`
- Card con borde gris (neutral) para diferenciar de acciones principales
- Uso de componentes del design system existente

### Tipografía
- Títulos: text-base, font-medium
- Descripciones: text-sm, text-gray-500
- Títulos de modal: text-lg, font-semibold
- Consistente con el resto del sistema

### Espaciado
- Padding de card: pt-6, pb-6
- Gap entre elementos: gap-4, space-y-3
- Márgenes coherentes con otras secciones

## Casos de uso cubiertos

### Caso 1: Colaborador abandona grupo
1. Usuario con rol "Colaborador" en grupo con varios miembros
2. Click en "Abandonar"
3. Confirma la acción
4. Es removido exitosamente
5. Grupo desaparece de su lista en /home

### Caso 2: Coadministrador abandona grupo
1. Usuario con rol "Coadministrador"
2. Hay al menos un Administrador en el grupo
3. Click en "Abandonar"
4. Confirma la acción
5. Es removido exitosamente
6. Grupo desaparece de su lista

### Caso 3: Administrador (no único) abandona grupo
1. Usuario con rol "Administrador"
2. Hay otro Administrador o Coadministrador en el grupo
3. Click en "Abandonar"
4. Confirma la acción
5. Es removido exitosamente

### Caso 4: Único administrador intenta abandonar
1. Usuario es el único con rol "Administrador"
2. Click en "Abandonar"
3. Sistema muestra restricción
4. Modal indica que debe transferir administración
5. Usuario hace click en "Entendido"
6. Permanece en el grupo

### Caso 5: Usuario cancela el abandono
1. Usuario click en "Abandonar"
2. Modal de confirmación se abre
3. Lée las consecuencias
4. Click en "Cancelar"
5. Modal se cierra sin cambios
6. Usuario permanece en el grupo

## Mejoras de experiencia implementadas

1. **Feedback visual claro**: Botón rojo indica acción destructiva
2. **Posición no dominante**: Sección al final de la página, no interfiere con funciones principales
3. **Doble confirmación**: Modal evita abandonos accidentales
4. **Explicación de consecuencias**: Usuario entiende qué perderá
5. **Validación proactiva**: Sistema detecta restricción de único admin antes de intentar procesar
6. **Estado de carga**: "Abandonando..." indica progreso
7. **Actualización inmediata**: Grupo desaparece al regresar a /home sin necesidad de refrescar

## Compatibilidad

- ✓ React 18+ con hooks
- ✓ TypeScript con tipado estricto
- ✓ Radix UI AlertDialog
- ✓ Tailwind CSS v4
- ✓ Lucide React icons
- ✓ localStorage para persistencia

## Notas de implementación

- **Simulación de latencia**: `setTimeout(800ms)` para simular procesamiento
- **Sin backend real**: Datos se actualizan solo en localStorage
- **No se elimina el grupo**: El grupo persiste en `familyGroups`, solo se remueve la membresía
- **Redirección automática**: Tras abandonar, usuario va a /home donde el filtrado automático oculta el grupo

## Próximos pasos sugeridos (fuera del alcance de esta HU)

- Implementación de transferencia de administración (requiere nueva HU)
- Notificación a otros miembros cuando alguien abandona
- Historial de cambios de membresía
- Confirmación por email antes de abandonar (seguridad adicional)
- Opción de "reincorporarse" si fue invitado previamente
- Sincronización con backend real
