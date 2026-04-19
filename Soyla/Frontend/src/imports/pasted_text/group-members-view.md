Diseñar la(s) pantalla(s) necesarias para implementar la siguiente Historia de Usuario, manteniendo consistencia visual y funcional con las pantallas ya creadas previamente (Login, Registro, Dashboard, Crear grupo familiar, Perfil, Editar Perfil e Invitación de usuarios) generadas en Figma Make.

El diseño debe integrarse con el sistema existente. No se deben modificar ni reemplazar las pantallas actuales, únicamente extender el flujo.

No se deben inventar nuevas funcionalidades, campos, flujos o comportamientos que no estén explícitamente definidos en esta Historia de Usuario o en sus criterios de aceptación.

Historia de Usuario: HU 2.3.3 – Visualización de Miembros del Grupo

Descripción:
Como miembro de un grupo familiar quiero visualizar los distintos miembros pertenecientes al grupo, para poder saber con quién estoy compartiendo la gestión de tareas.

Criterios de aceptación:

Escenario 1: Miembro visualiza la lista de miembros del grupo
Dado que un usuario accede a un grupo familiar
Cuando accede a la vista donde se encuentran los miembros del grupo
Entonces el sistema mostrará la lista de miembros con nombre y rol

Escenario 2: Información limitada para miembros no administradores
Dado que un miembro sin rol administrativo visualiza la lista de miembros
Cuando revisa los detalles de otro miembro
Entonces el sistema mostrará únicamente información pública (nombre y rol) y ocultará acciones de gestión

Escenario 3: Administrador visualiza la lista de miembros del grupo
Dado que un usuario ha iniciado sesión
Y entra a un grupo en el cual es administrador
Cuando accede a la vista de miembros
Entonces el sistema mostrará la lista completa con nombre, rol y opciones de asignación y modificación de roles

Escenario 4: Seguridad y privacidad de datos
Dado que el sistema gestiona información privada de los integrantes
Cuando un usuario intenta acceder mediante petición directa
Entonces el sistema valida el acceso y deniega la visualización si no pertenece al grupo

Escenario 5: Disponibilidad de la vista de miembros
Dado que un usuario necesita verificar los miembros del grupo
Cuando accede a esta funcionalidad
Entonces el sistema debe garantizar disponibilidad constante de la vista

Restricciones importantes:

* Mantener consistencia visual con el sistema existente (tipografía, colores, cards, botones, espaciados).
* Reutilizar componentes existentes (navbar, cards, listas, botones).
* Asumir que el usuario ya está autenticado.
* No modificar pantallas existentes.
* No diseñar base de datos ni lógica backend.
* No agregar funcionalidades adicionales fuera de lo especificado.
* Limitarse a mostrar miembros, roles y acciones únicamente para administradores.

Lineamientos de diseño UI:

* Diseñar una vista de lista de miembros dentro de una estructura clara (card o layout tipo lista).

* Cada miembro debe mostrarse como un elemento de lista que incluya:

  * Nombre del usuario
  * Rol dentro del grupo (ej: administrador / miembro)

* Mantener jerarquía visual clara:

  * Título de la vista (ej: “Miembros del grupo”)
  * Lista de miembros
  * Acciones (solo si aplica)

* Diferenciación por rol:

  * Para usuarios normales:

    * Solo visualización de nombre y rol
    * Sin botones ni acciones adicionales
  * Para administradores:

    * Mostrar acciones visibles para cada miembro (ej: cambiar rol)
    * Estas acciones deben tener menor peso visual que el contenido principal

* Usar espaciados consistentes:

  * Entre elementos de lista: 12px–16px
  * Entre secciones: 16px–32px

* Mantener diseño limpio y legible:

  * Uso de iconos o avatares es opcional, pero no obligatorio
  * Evitar sobrecargar la interfaz

* Estados visuales:

  * Estado normal (lista cargada)
  * Estado vacío (si no hay miembros, mostrar mensaje claro)
  * Estado de error (si acceso denegado, mostrar mensaje claro)
  * No diseñar lógica de seguridad, solo el estado visual

Consideraciones para implementación:

* El diseño debe ser fácilmente adaptable a React + Tailwind CSS.
* Utilizar componentes reutilizables (lista, item de miembro, badge de rol, botones).
* Usar clases estándar de Tailwind para espaciado (mt-4, mt-6, p-6, gap-4, etc.).
* Evitar medidas arbitrarias no estándar.
* Mantener tamaños consistentes (textos, badges, botones).
* Usar layout responsivo (flex, grid, listas verticales).
* Representar roles con estilos claros (ej: badge visual para “Administrador”).
* Asegurar que la diferencia entre administrador y miembro sea visualmente clara.

Resultado esperado:
Diseño de la vista de miembros del grupo que muestre la lista de integrantes con su nombre y rol, diferenciando correctamente entre usuarios normales y administradores, cumpliendo todos los criterios de aceptación, manteniendo coherencia con el sistema existente y sin agregar funcionalidades no especificadas.


Consideración adicional para visualización de roles:

* Los roles ya están definidos previamente en el sistema.
* Para efectos del diseño, utilizar únicamente los siguientes valores de referencia:

  * Administrador
  * Coadministrador
  * Colaborador
* No inventar nuevos roles ni modificar los existentes.
* Estos valores son solo representativos para la interfaz y no implican lógica adicional.