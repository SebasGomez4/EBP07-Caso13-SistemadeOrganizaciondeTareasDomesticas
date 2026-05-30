Quiero que implementes la siguiente historia de usuario COMPLETA dentro de la aplicación web existente, manteniendo el flujo actual del sistema, la arquitectura actual y las funcionalidades ya implementadas.

NO alucines funcionalidades nuevas.
NO inventes pantallas que no fueron solicitadas.
NO cambies la lógica de negocio existente.
NO alteres endpoints ni estructura del backend.
NO rompas componentes actuales.
NO elimines funcionalidades existentes.
NO modifiques navegación ya implementada excepto si es necesario para accesibilidad.
Solo implementa exactamente lo solicitado en esta HU.

La aplicación está desarrollada con React y Tailwind CSS, por lo tanto TODOS los cambios deben implementarse utilizando React + Tailwind CSS exclusivamente, respetando el diseño y estructura actual del proyecto.

HU: Adaptar la interfaz para usuarios con visión reducida (Accesibilidad)

Como usuario con visión reducida, quiero poder ampliar el contenido de la aplicación web sin perder funcionalidad ni tener dificultades en navegación, para utilizar el sistema de forma clara, sencilla y accesible.

Criterios de Aceptación:

Escenario 1: Escalado correcto de la interfaz

Dado que un usuario con visión reducida accede a la aplicación web

Cuando aumenta el zoom del navegador hasta un 200%

Entonces el sistema debe permitir la navegación e interacción sin pérdida de funcionalidades

Y los elementos interactivos deben seguir siendo identificables y accesibles

Implementación requerida:

* Adaptar layouts para soportar zoom hasta 200%.
* Evitar overflow horizontal innecesario.
* Evitar elementos superpuestos.
* Permitir wrapping correcto de texto y componentes.
* Mantener botones, inputs y menús completamente funcionales.
* Revisar cards, grids y contenedores rígidos.
* Usar layouts fluidos y adaptables.

Escenario 2: Navegación accesible con zoom ampliado

Dado que el usuario navega por la aplicación con el zoom aumentado

Cuando interactúa con menús, botones, formularios o módulos del sistema

Entonces el sistema debe permitir la navegación e interacción sin pérdida de funcionalidades

Y los elementos interactivos deben seguir siendo identificables y accesibles

Implementación requerida:

* Mantener tamaños clickeables adecuados.
* Mejorar spacing entre elementos interactivos.
* Mantener dropdowns y modales utilizables.
* Garantizar navegación clara incluso con zoom.
* Mejorar estados hover/focus/active.
* Asegurar que formularios no se rompan visualmente.

Escenario 3: Rendimiento con accesibilidad visual

Dado que un usuario utiliza la aplicación con zoom aumentado

Cuando accede a cualquier módulo del sistema

Entonces el tiempo de carga y respuesta no debe aumentar más de un 10% respecto al uso normal de la aplicación

Implementación requerida:

* No agregar librerías pesadas innecesarias.
* Mantener renderizados optimizados.
* Evitar cálculos visuales innecesarios.
* Mantener tiempos de carga actuales.
* Implementar mejoras únicamente mediante estilos y ajustes estructurales necesarios.

Escenario 4: Compatibilidad con herramientas de accesibilidad del navegador

Dado que un usuario utiliza herramientas de accesibilidad del navegador o del sistema operativo

Cuando accede a la aplicación web

Entonces el sistema debe permitir el uso de funciones de zoom y escalado sin bloquear ni alterar el funcionamiento de la interfaz

Implementación requerida:

* No bloquear zoom del navegador.
* No usar tamaños fijos rígidos innecesarios.
* Evitar técnicas que impidan escalado.
* Mantener compatibilidad con herramientas de accesibilidad.
* Usar unidades relativas cuando sea posible:

  * rem
  * em
  * porcentajes
* Mantener responsive design.

Escenario 5: Claridad visual de los contenidos ampliados

Dado que un usuario visualiza contenido ampliado en la aplicación web

Cuando consulta textos, botones o formularios

Entonces el sistema debe conservar contraste, legibilidad y organización visual adecuada para facilitar la lectura y navegación

Implementación requerida:

* Mejorar contraste visual donde sea necesario.
* Asegurar buena legibilidad tipográfica.
* Evitar textos demasiado pequeños.
* Mejorar jerarquía visual.
* Mantener labels visibles y claros.
* Mantener placeholders legibles.
* Mejorar focus visible en botones e inputs.
* Mantener consistencia visual con el diseño actual.

Requisitos técnicos obligatorios:

* Usar React.
* Usar Tailwind CSS.
* Mantener arquitectura actual.
* Mantener componentes reutilizables.
* Mantener funcionalidades existentes.
* Mantener navegación actual.
* Mantener diseño responsive.
* Mantener lógica existente.

Importante:

* NO rediseñar completamente la aplicación.
* NO cambiar branding actual.
* NO alterar funcionalidades existentes.
* NO convertir componentes actuales en componentes distintos.
* Solo implementar mejoras de accesibilidad visual y compatibilidad con zoom según esta historia de usuario.
