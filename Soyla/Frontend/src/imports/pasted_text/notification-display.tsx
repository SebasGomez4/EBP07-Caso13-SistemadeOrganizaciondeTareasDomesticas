Diseñar e integrar la funcionalidad de visualización de notificaciones dentro del sistema existente, manteniendo consistencia visual y funcional con las pantallas previamente generadas en Figma Make (Dashboard, Gestión de tareas, Alertas y demás módulos existentes).

No se debe rediseñar el sistema desde cero ni alterar el flujo actual de navegación. La funcionalidad debe integrarse de forma natural dentro de la experiencia ya construida.

No se deben inventar nuevas funcionalidades, tipos de notificación o comportamientos que no estén explícitamente definidos en esta Historia de Usuario o en sus criterios de aceptación.

Historia de Usuario: HU 4.1.1 – Visualizar Notificaciones

Descripción:
Como miembro de un grupo familiar quiero visualizar mis notificaciones pendientes para mantenerme informado sobre el estado de las tareas domésticas.

Criterios de aceptación:

Escenario 1: Acceso rápido a notificaciones
Dado que el usuario se encuentra dentro de la aplicación
Cuando visualiza la barra superior de navegación
Entonces el sistema debe mostrar:

* Un ícono de campana
* Ubicado junto al perfil del usuario
* Acceso rápido a notificaciones

Escenario 2: Visualización de notificaciones pendientes
Dado que el usuario tiene notificaciones relacionadas con actividades del grupo
Cuando accede a la sección de notificaciones
Entonces el sistema muestra:

* Lista organizada de notificaciones
* Ordenadas por más recientes
* Relacionadas con tareas domésticas

Escenario 3: Indicador de no leídas
Dado que existen notificaciones pendientes
Cuando el usuario navega en la aplicación
Entonces el sistema muestra:

* Contador o alerta visual
* Sobre el ícono de campana
* Indicando cantidad de notificaciones no leídas

Escenario 4: Visualización del detalle
Dado que el usuario visualiza la lista
Cuando selecciona una notificación
Entonces el sistema muestra:

* Detalle relacionado con la tarea
* Opción de navegar hacia dicha tarea

Escenario 5: Marcar como leída
Dado que el usuario abre una notificación
Cuando accede al contenido
Entonces el sistema:

* Marca la notificación como “Leída”
* Actualiza el contador de pendientes

Escenario 6: Tiempo de carga
Dado que el usuario accede a notificaciones
Cuando el sistema consulta la información
Entonces las notificaciones deben cargar en menos de 2 segundos

Escenario 7: Actualización automática
Dado que ocurre una nueva actividad relacionada con tareas domésticas
Cuando el usuario utiliza la aplicación
Entonces el sistema actualiza automáticamente:

* El contador
* La lista de notificaciones
  Sin necesidad de recargar manualmente

Restricciones importantes:

* No modificar el flujo general del sistema.
* No rediseñar pantallas existentes.
* No agregar funcionalidades no especificadas:

  * No chat
  * No mensajería privada
  * No filtros avanzados
  * No categorías complejas
  * No configuración avanzada de notificaciones
  * No respuestas a notificaciones
* No inventar nuevos tipos de notificación.
* Limitarse estrictamente a visualización de notificaciones relacionadas con tareas domésticas.

Lineamientos de diseño UI:

* Integrar el ícono de campana dentro de la barra superior existente.

* El ícono debe:

  * Ser visible pero discreto
  * Mantener coherencia con el diseño actual

* Mostrar contador visual:

  * Badge pequeño
  * Número de notificaciones no leídas

* Al abrir notificaciones:

  * Mostrar panel desplegable
  * O vista dedicada consistente con el sistema existente

* Cada notificación debe incluir:

  * Título breve
  * Descripción corta
  * Hora o fecha
  * Estado visual:

    * Leída
    * No leída

* Diferenciación visual:

  * Notificaciones no leídas resaltadas ligeramente
  * Mantener diseño limpio y moderno

* Al seleccionar una notificación:

  * Mostrar detalle relacionado
  * Permitir navegación hacia la tarea correspondiente

* Estados visuales:

  * Sin notificaciones
  * Notificaciones pendientes
  * Notificaciones leídas
  * Loading de carga

* Mensaje vacío:

  * “No tienes notificaciones pendientes”

* Actualización automática:

  * Reflejar nuevas notificaciones sin recargar la página

* Mantener diseño:

  * Minimalista
  * Limpio
  * Consistente con el sistema existente

* Evitar:

  * Popups agresivos
  * Sonidos automáticos
  * Animaciones excesivas
  * Saturación visual

Consideraciones para implementación:

* Compatible con React + Tailwind CSS.
* Utilizar componentes reutilizables:

  * Dropdowns
  * Toasts
  * Notification cards
  * Badges
  * Alerts
* Usar clases estándar de Tailwind:

  * fixed
  * top-4
  * right-4
  * rounded-xl
  * shadow-sm
  * border
  * p-4
  * transition
  * flex
  * gap-2
  * bg-muted
  * text-sm
  * hover:bg-muted/50
* Mantener diseño responsivo.
* No implementar backend ni servicios reales de sincronización.
* Solo representar visualmente flujo, notificaciones y estados esperados.

Resultado esperado:
Funcionalidad integrada de visualización de notificaciones, permitiendo al usuario consultar actividades relacionadas con tareas domésticas de forma clara y organizada, manteniendo coherencia con el sistema existente y sin agregar funcionalidades no especificadas.