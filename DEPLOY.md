# Configuracion de despliegue

## Render

Archivo listo para importar:

- `render.yaml`

Variables:

```env
APP_CORS_ALLOWED_ORIGINS=https://TU-PROYECTO.vercel.app,https://*.vercel.app
DATABASE_URL=<conexion de Render Postgres>
DATABASE_USERNAME=<usuario de Render Postgres>
DATABASE_PASSWORD=<password de Render Postgres>
```

Importante:

- Si usas `rootDir: Soyla`, en `render.yaml` deja `dockerfilePath` y `dockerContext` relativos a esa carpeta (`./Dockerfile` y `.`).
- Para evitar errores de CORS en deploys preview de Vercel, permite tambien `https://*.vercel.app`.
- En Render Free no hay discos persistentes para web services; para no perder usuarios y tareas usa Render Postgres.

## Vercel

Root Directory:

```txt
Soyla/Frontend
```

Build Command:

```txt
npm run build
```

Output Directory:

```txt
dist
```

Install Command:

```txt
npm install
```

Environment Variable:

```env
VITE_API_URL=https://TU-SERVICIO.onrender.com/api
```

Configura `VITE_API_URL` tanto en `Production` como en `Preview` dentro de Vercel para que ambos entornos apunten al backend correcto.
