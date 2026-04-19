Diseñar la(s) pantalla(s) necesarias para implementar la siguiente Historia de Usuario, manteniendo consistencia visual y funcional con las pantallas ya creadas previamente (Login, Registro, Dashboard, Crear grupo familiar, Visualización de Perfil y Editar Perfil) generadas en Figma Make.

El diseño debe integrarse con el sistema existente. No se deben modificar ni reemplazar las pantallas actuales, únicamente extender el flujo.

No se deben inventar nuevas funcionalidades, campos, flujos o comportamientos que no estén explícitamente definidos en esta Historia de Usuario o en sus criterios de aceptación.

Historia de Usuario: HU 2.1.2 – Invitación de usuarios

Descripción:
Como usuario quiero poder invitar a otros usuarios a mi grupo familiar para poder compartir la gestión de las tareas del hogar.

Criterios de aceptación:

Escenario 1: Generación de enlace único de invitación
Dado que un usuario pertenece a un grupo familiar
Y se encuentra en la sección de gestión de miembros
Cuando selecciona invitar a la familia
Entonces el sistema genera un enlace único asociado al grupo familiar

Escenario 2: Acceso al grupo mediante código válido
Dado que un usuario accede a la aplicación mediante un enlace de invitación válido
Cuando el usuario inicia sesión
Entonces el sistema lo agrega automáticamente al grupo familiar correspondiente

Escenario 3: Usuario ya pertenece al grupo
Dado que un usuario ya es miembro del grupo familiar
Cuando accede nuevamente al enlace de invitación
Entonces el sistema muestra un mensaje indicando que ya pertenece al grupo

Escenario 4: Acceso mediante enlace inválido o expirado
Dado que un usuario accede mediante un enlace de invitación inválido o expirado
Cuando el sistema valida el enlace
Entonces muestra un mensaje de error indicando que el enlace no es válido o ha expirado, y ofrece la opción de solicitar uno nuevo

Escenario 5: Seguridad y vigencia del enlace de invitación
Dado que se genera un enlace de invitación
Cuando el sistema lo crea
Entonces el enlace debe ser único, seguro y con vigencia máxima de 72 horas

Escenario 6: Tiempo de respuesta al procesar la invitación
Dado que un usuario accede mediante un enlace de invitación
Cuando el sistema valida el enlace y procesa el ingreso
Entonces la operación debe completarse en menos de 2 segundos bajo condiciones normales

Restricciones importantes:

* Mantener consistencia visual con el sistema existente (tipografía, colores, botones, layout y espaciados).
* Reutilizar componentes existentes (navbar, cards, botones, inputs, alertas).
* Asumir que el usuario puede estar autenticado o en proceso de autenticación según el flujo.
* No modificar pantallas existentes.
* No diseñar base de datos ni lógica backend.
* No agregar funcionalidades adicionales (roles, permisos avanzados, edición de miembros, etc.).
* Limitarse estrictamente a la generación de enlace, acceso mediante enlace y mensajes asociados.

Lineamientos de diseño UI:

* Diseñar las siguientes vistas necesarias para cumplir la HU:

  1. Vista de gestión de miembros (dentro del grupo):

     * Botón o acción clara: “Invitar a la familia”
     * Al activarse, mostrar:

       * Enlace de invitación generado
       * Opción visual para copiar el enlace
     * Mantener estructura en card/modal consistente con el sistema

  2. Estado de acceso mediante enlace:

     * Pantalla o estado intermedio que indique:

       * “Validando invitación...” (carga)
     * Mantener diseño simple y centrado

  3. Resultado de la invitación:

     * Caso exitoso: mensaje claro indicando que el usuario fue agregado al grupo
     * Caso usuario ya pertenece: mensaje informativo
     * Caso enlace inválido o expirado: mensaje de error claro + opción visible para solicitar nuevo enlace

* Mantener jerarquía visual clara:

  * Título → descripción → acción principal

* Usar espaciados consistentes:

  * Entre bloques: 16px–32px

* Botones:

  * Acción principal destacada (ej: copiar enlace, aceptar invitación)
  * Acciones secundarias con menor peso visual

* Mensajes:

  * Claros, visibles y coherentes con el sistema existente

* No diseñar lógica interna del token ni seguridad técnica, solo reflejar visualmente los estados definidos.

Consideraciones para implementación:

* El diseño debe ser fácilmente adaptable a React + Tailwind CSS.
* Utilizar componentes reutilizables (cards, botones, alertas, estados de carga).
* Usar clases estándar de Tailwind para espaciado (mt-4, mt-6, p-6, etc.).
* Evitar medidas arbitrarias no estándar.
* Usar tamaños consistentes (botones e inputs con h-10, h-11 o h-12).
* Implementar estados visuales claros:

  * Loading (indicador centrado)
  * Éxito
  * Error
  * Información (usuario ya pertenece)
* Usar layout responsivo con flex o grid.
* Mantener consistencia visual con el dashboard y demás vistas existentes.

Resultado esperado:
Diseño completo del flujo de invitación a grupo familiar mediante enlace, cubriendo generación, acceso, validación y resultados, cumpliendo todos los criterios de aceptación, manteniendo coherencia con el sistema existente y sin agregar funcionalidades no especificadas.