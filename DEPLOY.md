# Configuracion de despliegue

## Render

Archivo listo para importar:

- `render.yaml`

Variables:

```env
APP_CORS_ALLOWED_ORIGINS=https://TU-PROYECTO.vercel.app
SPRING_DATASOURCE_URL=jdbc:h2:file:/app/data/soyla-db;DB_CLOSE_ON_EXIT=FALSE
```

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
