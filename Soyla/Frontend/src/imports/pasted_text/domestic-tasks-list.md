Diseñar la(s) pantalla(s) necesarias para implementar la siguiente Historia de Usuario, manteniendo consistencia visual y funcional con las pantallas ya creadas previamente (Login, Registro, Dashboard, Crear grupo familiar, Perfil, Editar Perfil, Invitación de usuarios y Visualización de miembros) generadas en Figma Make.

El diseño debe integrarse con el sistema existente. No se deben modificar ni reemplazar las pantallas actuales, únicamente extender el flujo.

No se deben inventar nuevas funcionalidades, campos, flujos o comportamientos que no estén explícitamente definidos en esta Historia de Usuario o en sus criterios de aceptación.

Historia de Usuario: HU 4.2.1 – Visualización de la Lista de Tareas Domésticas

Descripción:
Como miembro de un grupo familiar quiero ver una lista de todas las tareas domésticas del grupo para poder conocer qué tareas están sin empezar, en progreso o completadas.

Criterios de aceptación:

Escenario 1: Visualización de tareas del grupo
Dado que el usuario pertenece a un grupo familiar
Cuando accede al módulo de tareas
Entonces el sistema muestra una lista con todas las tareas del grupo

Escenario 2: Información mostrada en la lista
Dado que el usuario visualiza la lista de tareas
Cuando el sistema carga las tareas disponibles
Entonces cada tarea muestra nombre, responsable, prioridad, fecha límite y estado actual

Escenario 3: Grupo sin tareas registradas
Dado que el usuario pertenece a un grupo familiar
Cuando accede al módulo de tareas
Y el grupo no tiene tareas registradas
Entonces el sistema muestra un mensaje indicando que no existen tareas registradas

Escenario 4: Visualización de tareas no asignadas
Dado que existen tareas sin responsable
Cuando el usuario visualiza la lista
Entonces el sistema muestra dichas tareas e indica claramente que no tienen responsable asignado

Escenario 5: Visualización de tareas sin prioridad
Dado que existen tareas sin prioridad definida
Cuando el usuario visualiza la lista
Entonces el sistema muestra dichas tareas e indica que no tienen prioridad asignada

Escenario 6: Actualización dinámica
Dado que el usuario visualiza la lista de tareas
Cuando otro miembro cambia el estado de una tarea
Entonces el sistema actualiza el estado en la interfaz en un tiempo no mayor a 3 segundos sin recargar la página

Escenario 7: Tiempo de respuesta
Dado que el usuario accede al módulo de tareas
Cuando el sistema carga la información
Entonces la lista se renderiza en menos de 2 segundos bajo condiciones normales

Restricciones importantes:

* Mantener consistencia visual con el sistema existente (tipografía, colores, layout, espaciados).
* Reutilizar componentes existentes (navbar, cards, listas, badges, botones si ya existen).
* Asumir que el usuario ya está autenticado y pertenece a un grupo.
* No modificar pantallas existentes.
* No diseñar base de datos ni lógica backend.
* No agregar funcionalidades adicionales (como creación, edición, eliminación o filtrado avanzado de tareas).
* Limitarse estrictamente a la visualización de tareas.

Lineamientos de diseño UI:

* Diseñar una vista tipo lista o tabla de tareas dentro de una estructura clara (card o layout principal).

* Cada tarea debe mostrar como mínimo:

  * Nombre de la tarea
  * Responsable (si existe)
  * Prioridad (si existe)
  * Fecha límite
  * Estado (ej: pendiente, en progreso, completada)

* Representación visual:

  * El estado debe diferenciarse claramente (ej: badge o etiqueta visual)
  * La prioridad puede mostrarse como texto o badge

* Casos especiales:

  * Tareas sin responsable:

    * Mostrar texto claro como “Sin asignar”
  * Tareas sin prioridad:

    * Mostrar texto claro como “Sin prioridad”

* Estado vacío:

  * Mostrar mensaje claro y centrado cuando no existan tareas

* Mantener jerarquía visual:

  * Título (ej: “Tareas del grupo”)
  * Lista de tareas

* Usar espaciados consistentes:

  * Entre tareas: 12px–16px
  * Entre secciones: 16px–32px

* Estados visuales:

  * Estado de carga (loading)
  * Estado normal (lista cargada)
  * Estado vacío (sin tareas)

* Actualización dinámica:

  * El diseño debe permitir reflejar cambios de estado sin recargar (no diseñar la lógica, solo considerar el comportamiento visual)

* Mantener diseño limpio, legible y enfocado en la información

Consideraciones para implementación:

* El diseño debe ser fácilmente adaptable a React + Tailwind CSS.
* Utilizar componentes reutilizables (lista de tareas, item de tarea, badges de estado y prioridad).
* Usar clases estándar de Tailwind para espaciado (mt-4, mt-6, p-6, gap-4, etc.).
* Evitar medidas arbitrarias no estándar.
* Mantener tamaños consistentes en textos y elementos visuales.
* Usar layout responsivo (flex, grid o listas).
* Implementar estados visuales claros:

  * Loading (indicador visual)
  * Estado vacío (mensaje visible)
* Representar estados con estilos consistentes (ej: colores o badges reutilizables).

Resultado esperado:
Diseño de la vista de lista de tareas del grupo que muestre todas las tareas con su información relevante (nombre, responsable, prioridad, fecha y estado), incluyendo casos especiales y estados visuales, cumpliendo todos los criterios de aceptación, manteniendo coherencia con el sistema existente y sin agregar funcionalidades no especificadas.
