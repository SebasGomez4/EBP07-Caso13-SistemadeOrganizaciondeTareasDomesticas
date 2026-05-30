# HU 1.1.2 – Confirmación de Registro Vía Correo Electrónico

## Descripción

Como usuario quiero recibir confirmación vía correo electrónico para poder saber que mi cuenta fue creada con éxito.

## Implementación

### Archivos modificados

- `/src/app/pages/Register.tsx` — creación de usuarios con estado "pending" y generación de tokens
- `/src/app/pages/Login.tsx` — verificación de cuenta activada antes de permitir login
- `/src/app/routes.ts` — ruta añadida para `/confirm-email/:token`

### Archivos creados

- `/src/app/pages/ConfirmEmail.tsx` — pantalla de confirmación con manejo de estados (success, expired, invalid)

### Criterios implementados

| Escenario | Estado | Detalle |
|-----------|--------|---------|
| 1. Envío exitoso del correo | ✅ | Usuario creado con `status: "pending"`, token generado, pantalla "Revisa tu correo" |
| 2. Confirmación exitosa | ✅ | Validación de token, activación de cuenta (`status: "active"`), redirecció n a login |
| 3. Enlace expirado | ✅ | Validación de 24h, pantalla de error con opción "Reenviar correo" |
| 4. Tiempo de entrega < 30s | ✅ | Simulado — token y console.log inmediatos (< 1s) |
| 5. Diseño responsivo | ✅ | Todas las pantallas usan Tailwind con clases responsive |

### Estructura de datos

#### Usuario extendido

```ts
interface User {
  fullName: string;
  email: string;
  password: string;
  status: "pending" | "active"; // Nuevo campo
  createdAt: number;            // Timestamp de creación
}
```

#### Token de confirmación

```ts
// localStorage: "emailConfirmationTokens"
interface EmailConfirmationToken {
  id: string;
  userId: string;
  email: string;
  token: string;         // Token aleatorio único
  createdAt: number;     // Timestamp de creación
  expiresAt: number;     // createdAt + 24h
}
```

### Flujo implementado

#### 1. Registro (Escenario 1)

**Register.tsx**:
1. Usuario completa formulario y presiona "Registrarse"
2. Sistema valida datos (email, contraseña compleja, no duplicado)
3. Crea usuario con `status: "pending"` y `createdAt: Date.now()`
4. Genera token con validez de 24h
5. Guarda en `localStorage.emailConfirmationTokens`
6. **Simula envío de correo** (log en consola con URL de confirmación)
7. Muestra pantalla "Revisa tu correo electrónico" con:
   - Email registrado
   - Instrucciones claras
   - Validez del enlace (24h)
   - Aviso de revisar spam
   - Botón "Volver al inicio de sesión"
   - Link "Reenviar correo" (funcional)

#### 2. Confirmación de email (Escenario 2)

**ConfirmEmail.tsx** (`/confirm-email/:token`):
1. Usuario hace clic en enlace del correo simulado
2. Pantalla muestra "Verificando tu cuenta..." (800ms)
3. Sistema busca token en `localStorage.emailConfirmationTokens`
4. Valida que no haya expirado (`Date.now() <= expiresAt`)
5. Encuentra usuario por email
6. Cambia `status: "active"`
7. Elimina token usado (seguridad)
8. Muestra pantalla de éxito:
   - Icono verde con check
   - "¡Cuenta activada!"
   - Email confirmado
   - Botón "Continuar al inicio de sesión"

#### 3. Enlace expirado (Escenario 3)

**ConfirmEmail.tsx** — cuando `Date.now() > expiresAt`:
1. Detecta expiración (24h)
2. Muestra pantalla naranja de advertencia:
   - "Enlace expirado"
   - Explicación de validez de 24h
   - Email asociado
   - Botón "Reenviar correo de confirmación"
   - Botón "Volver al inicio de sesión"
3. Al hacer clic en "Reenviar":
   - Elimina tokens anteriores del mismo email
   - Genera nuevo token con 24h de validez
   - Simula envío (log en consola)
   - Muestra mensaje de éxito temporal (5s)

#### 4. Enlace inválido

**ConfirmEmail.tsx** — cuando token no existe o ya fue usado:
1. Pantalla roja de error
2. "Enlace inválido"
3. Explicación de causas posibles
4. Botones:
   - "Volver al registro"
   - "Ir al inicio de sesión"

#### 5. Login con cuenta pendiente

**Login.tsx**:
1. Usuario intenta iniciar sesión
2. Credenciales correctas PERO `status === "pending"`
3. Muestra error:
   > "Tu cuenta aún no ha sido activada. Por favor, revisa tu correo electrónico y confirma tu registro."
4. Login bloqueado hasta activación

### Template de correo (simulado)

El correo simulado se genera en consola con:

```
[SIMULADO] Correo enviado a {email}:
  Asunto: Confirma tu registro en Soyla
  Enlace: {origin}/confirm-email/{token}
```

**Contenido esperado del correo real** (Escenario 5):

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirma tu registro en Soyla</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header con logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #7c3aed; font-size: 28px; font-weight: bold;">Soyla</h1>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">Gestión de tareas domésticas</p>
            </td>
          </tr>
          
          <!-- Contenido principal -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 22px;">¡Bienvenido!</h2>
              <p style="margin: 0 0 16px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Gracias por registrarte en Soyla. Para completar tu registro y activar tu cuenta, por favor confirma tu correo electrónico haciendo clic en el botón de abajo.
              </p>
              
              <!-- Botón de confirmación -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{CONFIRMATION_URL}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #7c3aed, #3b82f6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                      Confirmar mi correo electrónico
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
              </p>
              <p style="margin: 12px 0 0; color: #6b7280; font-size: 13px;">
                Este enlace es válido por <strong>24 horas</strong>.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Este es un correo automático. Por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Estados visuales

| Estado | Pantalla | Color | Icono | Acción |
|--------|----------|-------|-------|--------|
| Registro exitoso | Register.tsx (post-submit) | Morado/azul | Mail | Mostrar email registrado, instrucciones |
| Verificando | ConfirmEmail (loading) | Morado | Loader2 (spin) | Esperar validación |
| Confirmación exitosa | ConfirmEmail (success) | Verde | CheckCircle2 | Redirigir a login |
| Enlace expirado | ConfirmEmail (expired) | Naranja | AlertCircle | Permitir reenvío |
| Enlace inválido | ConfirmEmail (invalid) | Rojo | XCircle | Opciones de recuperación |
| Login cuenta pendiente | Login.tsx (error) | Rojo | AlertCircle | Mensaje informativo |

### Restricciones respetadas

- ✅ No se implementó doble factor de autenticación
- ✅ No se implementó recuperación de contraseña
- ✅ No se implementó verificación por SMS
- ✅ No se agregaron perfiles avanzados
- ✅ No se creó gestión avanzada de correos
- ✅ No se inventaron estados adicionales (solo "pending" y "active")
- ✅ Flujo de autenticación existente no fue modificado, solo extendido

### Mejoras implementadas

- **Seguridad**: Tokens eliminados tras uso exitoso
- **UX**: Mensajes claros y diferenciados por estado
- **Resiliencia**: Opción de reenvío en caso de expiración
- **Logging**: Console.log para debug y demostración del envío simulado
- **Consistencia**: Mismo diseño visual que Login y Register

### Testing

Para probar el flujo completo:

1. **Registro**:
   - Ir a `/register`
   - Completar formulario con datos válidos
   - Observar pantalla "Revisa tu correo"
   - En consola, copiar URL de confirmación

2. **Confirmación exitosa**:
   - Pegar URL del paso 1 en navegador
   - Observar "Verificando..." → "¡Cuenta activada!"
   - Hacer clic en "Continuar al inicio de sesión"
   - Iniciar sesión normalmente

3. **Enlace expirado** (simular):
   - Ir a localStorage → `emailConfirmationTokens`
   - Editar `expiresAt` de un token a timestamp pasado
   - Acceder a la URL del token
   - Observar pantalla naranja "Enlace expirado"
   - Probar "Reenviar correo"
   - Usar nuevo enlace de la consola

4. **Enlace inválido**:
   - Acceder a `/confirm-email/tokeninexistente123`
   - Observar pantalla roja "Enlace inválido"

5. **Login con cuenta pendiente**:
   - Registrar usuario nuevo (sin confirmar)
   - Intentar login con esas credenciales
   - Observar error indicando cuenta no activada
