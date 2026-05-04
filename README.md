# EP07 - Sistema de Organizacion de Tareas Domesticas

## Descripcion
`Soyla` es una aplicacion para organizar tareas del hogar entre miembros de una familia o convivencia. El proyecto queda separado en:

- `Soyla/`: backend Spring Boot con API REST y persistencia H2.
- `Soyla/Frontend`: frontend React + Vite preparado para consumir la API desde `VITE_API_URL`.

## Funcionalidades integradas

- Registro e inicio de sesion
- Perfil y actualizacion de correo y telefono
- Creacion de grupos familiares
- Invitaciones por enlace
- Gestion de miembros y roles
- Creacion, asignacion y eliminacion de tareas

## Desarrollo local

### Opcion 1: con Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

### Opcion 2: sin Docker

Backend:

```bash
cd Soyla
./mvnw spring-boot:run
```

Frontend:

```bash
cd Soyla/Frontend
npm install
npm run dev
```

Usa `Soyla/Frontend/.env.example` como referencia para `VITE_API_URL`.

## Despliegue

### Frontend en Vercel

Configura el proyecto apuntando a `Soyla/Frontend` y usa:

- Build command: `npm run build`
- Output directory: `dist`
- Variable: `VITE_API_URL=https://TU-BACKEND.onrender.com/api`

El archivo `vercel.json` ya agrega el rewrite para que las rutas del SPA funcionen.
Configura `VITE_API_URL` en `Production` y `Preview` dentro de Vercel para que ambos entornos usen el backend correcto.

### Backend en Render con Docker

Configura el servicio web apuntando a `Soyla/` para que Render use el `Dockerfile`.

Variables recomendadas:

- `APP_CORS_ALLOWED_ORIGINS=https://TU-FRONTEND.vercel.app,https://*.vercel.app`
- `SPRING_DATASOURCE_URL=jdbc:h2:file:/app/data/soyla-db;DB_CLOSE_ON_EXIT=FALSE`

Si quieres persistencia real en Render, monta un disco y conserva la ruta `/app/data`.
Si usas `rootDir: Soyla`, deja `dockerfilePath` y `dockerContext` relativos a esa carpeta.

## Verificacion realizada

- `./mvnw test`
- `npm run build`
