# HU 2.3.1 – Visualizar grupos familiares

## Resumen de implementación

Este documento describe la implementación de la funcionalidad de visualización de grupos familiares según los criterios de aceptación de la Historia de Usuario 2.3.1.

## Descripción

Como usuario quiero ver los grupos familiares a los cuales pertenezco, para poder acceder al grupo donde se gestionan las tareas.

## Pantalla modificada

### Home (`/src/app/pages/Home.tsx`)

La pantalla principal del usuario autenticado ahora implementa la lógica completa de visualización de grupos familiares.

## Funcionalidades implementadas

### Escenario 1: Lista de grupos

**Implementación:**
- Se lee el array de grupos familiares desde `localStorage.getItem("familyGroups")`
- Se filtran los grupos donde el usuario es creador o miembro
- Se obtiene el rol del usuario en cada grupo desde `localStorage.getItem("groupRoles")`
- Si el usuario es creador del grupo, su rol es "Administrador" automáticamente
- Se muestra una grid responsiva (1 columna en móvil, 2 columnas en desktop) con cards de grupos

**Información mostrada por grupo:**
- Nombre del grupo
- Rol del usuario dentro del grupo (con ícono diferenciado):
  - Administrador: ícono Shield (escudo) en purple-600
  - Coadministrador: ícono UserCog (usuario con engranaje) en blue-600
  - Colaborador: ícono User (usuario simple) en gray-600

**Diseño del card:**
- Ícono circular con gradiente purple-blue
- Nombre del grupo con hover effect (cambia a purple-600)
- Indicador del rol con ícono
- Chevron derecho como indicador de navegación
- Efecto hover: sombra y borde más intensos
- Cursor pointer para indicar que es clickeable

**Botón adicional:**
- Botón "Nuevo grupo" visible en la esquina superior derecha para crear más grupos

### Escenario 2: Usuario sin grupos

**Implementación:**
- Si el array de grupos del usuario está vacío, se muestra un estado vacío
- Card central con ícono de Users
- Mensaje claro: "No perteneces a ningún grupo"
- Descripción: "Comienza a organizar las tareas del hogar creando tu primer grupo familiar"
- Botón principal: "Crear grupo" con ícono de Users

**Diseño:**
- Consistente con el diseño previo del sistema
- Card con gradiente purple-blue en el ícono
- Botón con gradiente from-purple-600 to-blue-600
- Texto descriptivo y claro

### Escenario 3: Acceso a grupo

**Implementación:**
- Cada card de grupo es completamente clickeable
- Al hacer clic en cualquier parte del card, se ejecuta `handleGroupClick(groupId)`
- Navega a la ruta `/grupo/:groupId` usando React Router
- Efecto visual al hacer hover para indicar interactividad

**Feedback visual:**
- Cursor pointer en toda el área del card
- Sombra y borde más intensos al hacer hover
- Color del nombre del grupo cambia a purple-600 al hacer hover
- Fondo del ícono de navegación cambia de purple-50 a purple-100

### Escenario 4: Tiempo de carga

**Implementación:**
- Se simula una latencia de 600ms para cargar los grupos (< 2 segundos requeridos)
- Estado de carga con spinner animado y mensaje "Cargando grupos familiares..."
- Card de carga con diseño consistente con el sistema
- Animación de pulso en el indicador de carga

**Estado de carga:**
```tsx
{loading ? (
  <Card>
    <CardContent>
      <div className="animate-pulse">...</div>
      <p>Cargando grupos familiares...</p>
    </CardContent>
  </Card>
) : (
  // Contenido principal
)}
```

### Escenario 5: Persistencia y consistencia

**Implementación:**
- Los datos se leen directamente desde localStorage en cada carga
- Función `loadUserGroups(email)` que:
  1. Lee el estado actual de `familyGroups`
  2. Lee el estado actual de `groupMembers`
  3. Lee el estado actual de `groupRoles`
  4. Filtra y construye la lista de grupos del usuario con datos actualizados
- No se cachean datos para evitar información desactualizada
- Se limpia `lastCreatedGroup` si existe para evitar datos obsoletos

**Lógica de roles:**
```typescript
// Si es creador, es Administrador
if (isCreator) {
  userRole = "Administrador";
} else {
  // Si es miembro, obtener rol del registro
  const groupRoles = roles[group.id] || {};
  const roleInGroup = groupRoles[email];
  userRole = roleInGroup || "Colaborador";
}
```

## Estructura de datos utilizada

### FamilyGroup
```typescript
interface FamilyGroup {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}
```

### UserGroup (para visualización)
```typescript
interface UserGroup {
  id: string;
  name: string;
  role: "Administrador" | "Coadministrador" | "Colaborador";
}
```

### localStorage keys utilizadas
- `familyGroups`: Array de todos los grupos familiares
- `groupMembers`: Objeto con groupId como key y array de emails como value
- `groupRoles`: Objeto anidado con groupId → email → role

## Componentes y elementos visuales

### Imports adicionales
```typescript
import { 
  ChevronRight,  // Indicador de navegación
  Shield,        // Rol Administrador
  UserCog,       // Rol Coadministrador
  User          // Rol Colaborador
} from "lucide-react";
```

### Grid responsivo
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Cards de grupos */}
</div>
```

### Estados implementados
1. **Loading**: Spinner con mensaje de carga
2. **Lista con grupos**: Grid de cards clickeables
3. **Estado vacío**: Card central con CTA para crear grupo

## Principios de diseño aplicados

### Coherencia visual
- Mantiene el esquema de colores purple-600 / blue-600 del sistema
- Usa el mismo estilo de cards con `shadow-sm` y `border-purple-100`
- Gradientes consistentes en íconos y botones
- Tipografía y espaciados coherentes con el resto del sistema

### Interactividad clara
- Cursor pointer en cards clickeables
- Efectos hover suaves y perceptibles
- Indicador visual de navegación (ChevronRight)
- Diferenciación visual entre estados (normal, hover, loading)

### Jerarquía de información
1. Encabezado principal con nombre del usuario
2. Título de sección "Mis Grupos Familiares"
3. Botón de acción "Nuevo grupo"
4. Grid de grupos familiares
5. Información de sesión al final

### Accesibilidad
- Áreas de clic amplias (todo el card es clickeable)
- Íconos descriptivos para cada rol
- Mensajes claros y comprensibles
- Estados visuales bien diferenciados

## Flujo de navegación

```
Login → Home (lista de grupos) → Click en grupo → GroupView
          ↓
     Crear grupo → GroupCreated → Home (lista actualizada)
```

## Restricciones respetadas

✓ No se agregó búsqueda de grupos
✓ No se agregaron filtros
✓ No se agregó edición de grupos desde esta vista
✓ No se agregó eliminación de grupos
✓ No se inventó información adicional (solo nombre y rol como especificado)
✓ No se modificó el flujo de navegación existente
✓ No se rediseñaron otras pantallas

## Mejoras de experiencia implementadas

1. **Indicadores de rol con íconos**: Cada rol tiene un ícono distintivo para facilitar el reconocimiento visual
2. **Botón "Nuevo grupo" siempre visible**: Permite crear más grupos sin tener que buscar la opción
3. **Grid responsivo**: Se adapta a diferentes tamaños de pantalla (1 columna en móvil, 2 en desktop)
4. **Efectos hover coherentes**: Todos los elementos interactivos tienen feedback visual consistente
5. **Estado de carga profesional**: Spinner con mensaje claro durante la carga de datos

## Casos de uso cubiertos

### Usuario nuevo (sin grupos)
1. Inicia sesión
2. Ve mensaje "No perteneces a ningún grupo"
3. Hace clic en "Crear grupo"
4. Crea su primer grupo
5. Regresa a Home y ve su grupo en la lista

### Usuario con grupos existentes
1. Inicia sesión
2. Ve lista de grupos con su rol en cada uno
3. Hace clic en un grupo
4. Accede a la vista de gestión de tareas del grupo

### Usuario invitado a un grupo
1. Acepta invitación (flujo existente)
2. Regresa a Home
3. Ve el nuevo grupo en su lista con rol "Colaborador"

## Compatibilidad

- ✓ React 18+
- ✓ React Router 7+
- ✓ Tailwind CSS v4
- ✓ TypeScript
- ✓ Componentes UI existentes (Button, Card, etc.)
- ✓ Lucide React icons

## Notas de implementación

- **Simulación de latencia**: Se usa `setTimeout(600ms)` para simular carga de datos
- **Sin backend real**: Todos los datos se leen de localStorage
- **Actualización automática**: Los datos se recargan cada vez que se accede a Home
- **Roles automáticos**: El creador siempre es Administrador, los invitados empiezan como Colaborador

## Próximos pasos sugeridos (fuera del alcance de esta HU)

- Implementación de búsqueda de grupos (si se requiere en futuras HU)
- Filtros por rol (si se requiere en futuras HU)
- Paginación si el número de grupos crece significativamente
- Sincronización con backend real
- Notificaciones cuando se agrega a un nuevo grupo
- Indicador de tareas pendientes por grupo
