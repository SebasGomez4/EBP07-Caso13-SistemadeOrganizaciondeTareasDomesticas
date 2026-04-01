Diseñar la(s) pantalla(s) necesarias para implementar la siguiente Historia de Usuario, manteniendo consistencia visual y funcional con las vistas existentes del sistema (especialmente la vista de grupo familiar).

Es fundamental que el diseño respete los estilos, componentes, layout (header “Soyla”) y estructura ya definidos en la aplicación. No se deben modificar ni reemplazar las pantallas existentes, únicamente integrarse con ellas.

No se deben inventar funcionalidades, flujos adicionales ni comportamientos que no estén explícitamente definidos en esta Historia de Usuario o en sus criterios de aceptación.

Historia de Usuario: HU 3.1.1 – Creación de tareas domésticas

Descripción:
Como miembro de un grupo familiar quiero crear una tarea doméstica para poder organizar las responsabilidades del hogar entre los miembros del grupo familiar.

Criterios de aceptación (Gherkin):

Escenario 1: Un miembro del grupo familiar crea una tarea doméstica
Dado que un usuario hace parte de un grupo familiar
Cuando ingresa el nombre de la tarea doméstica
Y su descripción
Y una fecha límite válida
Y una frecuencia de realización para la tarea, tal que puede ser "ninguna", "diaria", "semanal" o "mensual"
Entonces la tarea doméstica se crea correctamente en el grupo familiar

Escenario 2: El sistema confirma la creación de la tarea doméstica.
Dado que un usuario hace parte de un grupo familiar
Cuando cree una tarea doméstica correctamente
Y la información sea guardada en el sistema
Entonces se muestra un mensaje de confirmación indicando que la tarea fue creada exitosamente.

Escenario 3: El miembro del grupo familiar ingresa una fecha límite no válida
Dado que un usuario hace parte de un grupo familiar
Cuando ingresa el nombre de la tarea doméstica
Y su descripción
Y una fecha límite anterior a la fecha de creación
Entonces la tarea doméstica no se crea
Y se muestra un mensaje indicando que la fecha límite no es válida

Escenario 4: El miembro del grupo familiar no ingresa el nombre de la tarea doméstica
Dado que un usuario hace parte de un grupo familiar
Cuando no ingresa el nombre de la tarea doméstica
Y su descripción
Y una fecha límite válida
Entonces la tarea doméstica no se crea
Y se muestra un mensaje indicando que el nombre de la tarea es obligatorio.

Escenario 5: El miembro del grupo familiar ingresa el nombre de la tarea doméstica sólo con caracteres especiales
Dado que un usuario hace parte de un grupo familiar
Cuando ingresa el nombre de la tarea doméstica con sólo caracteres especiales
Y su descripción
Y una fecha límite válida
Entonces la tarea doméstica no se crea
Y se muestra un mensaje indicando que el nombre de la tarea no puede contener sólo caracteres especiales

Escenario 6: El miembro del grupo familiar ingresa el nombre de la tarea doméstica sólo con números
Dado que un usuario hace parte de un grupo familiar
Cuando ingresa el nombre de la tarea doméstica con sólo números
Y su descripción
Y una fecha límite válida
Entonces la tarea doméstica no se crea
Y se muestra un mensaje indicando que el nombre de la tarea no puede contener sólo números

Escenario 7: El sistema notifica a todos los miembros del grupo familiar la creación de la tarea doméstica.
Dado que un usuario hace parte de un grupo familiar
Cuando cree una tarea doméstica correctamente
Y la información sea guardada en el sistema
Entonces se envía una notificación a todos miembros del grupo familiar informando que se ha creado la tarea, informando además los detalles de ésta

Escenario 8: Tiempo de creación de una tarea domestica
Dado que un usuario hace parte de un grupo familiar
Y completa los campos de creación de una tarea domestica
Cuando envía la información
Entonces el sistema la procesa
Y crea la tarea en un tiempo menor o igual a 3 segundos

Escenario 9: Tiempo de notificación de la creación de una tarea
Dado que un usuario hace parte de un grupo familiar
Cuando cree una tarea doméstica correctamente
Entonces el sistema envía una notificación vía correo electrónico a todos los miembros de la familia informando la creación de esta, con sus detalles en un lapso no mayor a 3 minutos

Restricciones importantes:

* El flujo debe asumir que el usuario ya hace parte de un grupo familiar.
* La funcionalidad debe integrarse dentro de la vista del grupo familiar (no crear una pantalla aislada tipo autenticación).
* No modificar funcionalidades existentes del grupo.
* No agregar funcionalidades fuera del alcance (por ejemplo: edición, eliminación, asignación de tareas, etc.).
* No diseñar backend ni persistencia de datos.
* Mantener consistencia visual con el sistema existente (header, espaciados, inputs, botones, tipografía).
* Mantener compatibilidad con React + Tailwind CSS (componentes reutilizables, layout basado en contenedores, uso de estados visuales).

Consideraciones de diseño y visualización (MUY IMPORTANTE):

* El formulario de creación de tareas debe ser claro, limpio y bien estructurado.
* Evitar diseño tipo “modal flotante excesivo”; debe integrarse como parte natural de la vista del grupo.
* Usar un contenedor bien espaciado, sin saturación visual.
* Mantener jerarquía visual clara (título, campos, botón).

Campos obligatorios del formulario:

* Nombre de la tarea
* Descripción
* Fecha límite (selector de fecha)
* Frecuencia (selector con opciones: ninguna, diaria, semanal, mensual)

Validaciones visuales obligatorias:

* Mostrar mensajes claros y visibles cuando:

  * El nombre está vacío
  * El nombre tiene solo caracteres especiales
  * El nombre tiene solo números
  * La fecha límite es inválida (anterior a la actual)
* Los mensajes deben ser comprensibles y ubicados cerca del campo correspondiente.

Estados de interacción:

* Estado de carga (loading) al enviar la tarea (máximo 3 segundos).
* Estado de éxito con mensaje de confirmación claro (“Tarea creada exitosamente”).
* No bloquear la interfaz de forma abrupta.

Consideración sobre notificaciones:

* Representar visualmente que la tarea fue creada y que se notificará a los miembros.
* No implementar sistema real de notificaciones (solo indicación visual).

Estructura esperada:

* Sección dentro de la vista del grupo:

  * Título: “Crear tarea doméstica”
  * Formulario organizado
  * Botón principal de acción
* Diseño alineado con el resto del sistema (no centrado tipo landing).

Importante:

* No modificar el layout global (header “Soyla”).
* No romper la estructura de navegación existente.
* No alterar otras pantallas.
* No generar contenido fuera de esta HU.

Objetivo:

Diseñar una interfaz clara, funcional y visualmente bien estructurada para la creación de tareas domésticas dentro del grupo familiar, cumpliendo todos los criterios de aceptación sin desviaciones ni elementos innecesarios.
