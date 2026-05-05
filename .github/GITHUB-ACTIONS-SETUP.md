# 🚀 Guía de Configuración: GitHub Actions CI/CD

## 📋 Descripción General

El archivo `.github/workflows/ci-cd.yml` automatiza el pipeline completo de validación y despliegue del proyecto Soyla:

### 🔄 Flujo de Ejecución
1. **Backend Validation** - Compila y prueba el código Java/Maven
2. **Frontend Validation** - Instala dependencias y construye con Vite
3. **Security Analysis** - Audita vulnerabilidades en ambos lados
4. **Build Docker** - Crea la imagen Docker (necesita los pasos anteriores)
5. **Deploy Render** - Despliegue automático en Render (solo en rama `main`)

---

## 🔐 Configuración de GitHub Secrets

Para que el workflow funcione correctamente, configura estos secrets en GitHub:

### Pasos para Agregar Secrets:
1. Ve a tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret**
4. Agrega los siguientes secrets:

### Secrets Requeridos

#### 1. **RENDER_DEPLOY_HOOK** (Opcional, solo si usas Render)
```
Propósito: URL para desplegar automáticamente a Render
Cómo obtenerlo:
  1. Ve a Render Dashboard: https://dashboard.render.com
  2. Selecciona tu servicio (soyla-api)
  3. Settings → Deploy Hook
  4. Copia la URL completa
  5. Agrega como secret en GitHub
```

#### 2. **DOCKER_REGISTRY_USERNAME** (Opcional, para registros privados)
```
Usuario del registro Docker privado
```

#### 3. **DOCKER_REGISTRY_PASSWORD** (Opcional, para registros privados)
```
Token o contraseña del registro Docker privado
```

---

## ⚙️ Configuración Adicional Recomendada

### 1. **Ramas Principales**
El workflow se ejecuta automáticamente en:
- Push a `main` y `develop`
- Pull Requests a `main` y `develop`

Si tus ramas tienen otros nombres, edita el archivo `.github/workflows/ci-cd.yml`:

```yaml
on:
  push:
    branches:
      - main          # ← Cambia aquí si es necesario
      - develop       # ← Agrega o modifica según tus ramas
  pull_request:
    branches:
      - main
      - develop
```

### 2. **Variables de Entorno (env)**
Puedes personalizar las versiones de Java y Node.js:

```yaml
env:
  JAVA_VERSION: '17'  # ← Cambiar si necesitas otra versión
  NODE_VERSION: '20'  # ← Cambiar si necesitas otra versión
```

---

## 📊 Monitoreo del Workflow

### Ver ejecuciones en tiempo real:
1. Ve al repositorio en GitHub
2. **Actions** tab
3. Selecciona el workflow `CI/CD Pipeline - Soyla`
4. Observa el estado de cada job

### Diferencia entre estados:
- ✅ **Success**: Todos los pasos completaron correctamente
- ❌ **Failed**: Algún paso falló (revisa logs)
- ⏳ **In Progress**: El workflow está ejecutándose
- ⊘ **Cancelled**: El workflow fue cancelado manualmente

---

## 🔧 Troubleshooting

### Problema: Backend tests fallan
```bash
# Solución: Revisa los logs del job "Backend Validation"
# Ve a: Actions → CI/CD Pipeline → backend-validation
# Busca el error en los logs
```

### Problema: Frontend build falla
```bash
# Revisa que package.json esté en Soyla/Frontend/
# Verifica que package-lock.json sea correcto
```

### Problema: Docker build falla
```bash
# Asegúrate de que el Dockerfile esté en Soyla/
# Verifica que pom.xml esté en Soyla/ (backend)
```

### Problema: Deploy no se ejecuta
```bash
# Verifica que:
# 1. RENDER_DEPLOY_HOOK esté configurado correctamente
# 2. El push sea a la rama 'main'
# 3. Los jobs anteriores completaron exitosamente
```

---

## 📝 Logs y Reportes

El workflow genera varios artefactos que puedes descargar:

| Artefacto | Ubicación | Retención |
|-----------|-----------|-----------|
| Backend Test Reports | `backend-test-reports/` | 7 días |
| Frontend Build | `frontend-build/` | 7 días |

Para descargar:
1. Ve a **Actions** → Último workflow ejecutado
2. Baja a **Artifacts**
3. Descarga el artefacto deseado

---

## 🎯 Mejores Prácticas Implementadas

✅ **Separación clara de responsabilidades** - Cada job tiene una tarea específica  
✅ **Caché de dependencias** - Optimiza el tiempo de ejecución  
✅ **Seguridad** - Usa GitHub Secrets para credenciales  
✅ **Fail-fast** - Se detiene en el primer error  
✅ **Concurrencia controlada** - Cancela workflows duplicados  
✅ **Condiciones inteligentes** - Deploy solo en rama main  
✅ **Notificaciones de estado** - Resumen final del pipeline  
✅ **Auditoría de dependencias** - Busca vulnerabilidades  

---

## 🚀 Próximas Mejoras

- [ ] Agregar tests de integración automatizados
- [ ] Implementar notificaciones Slack/Discord en caso de falla
- [ ] Agregar análisis de cobertura de código
- [ ] Implementar deployment a múltiples ambientes (staging, production)
- [ ] Agregar aprovisionamiento de base de datos de prueba

---

## 📚 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build & Push Action](https://github.com/docker/build-push-action)
- [Maven in CI/CD](https://maven.apache.org/guides/introduction/introduction-to-the-standard-directory-layout.html)
- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
