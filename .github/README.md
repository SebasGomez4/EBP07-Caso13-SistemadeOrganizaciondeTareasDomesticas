# 🚀 GitHub Actions CI/CD - Soyla

Configuración profesional de **Integración y Despliegue Continuo (CI/CD)** para el proyecto Soyla, siguiendo buenas prácticas de código limpio y seguridad.

---

## 📁 Archivos de Configuración

### En la carpeta `.github/workflows/`

| Archivo | Descripción |
|---------|-------------|
| **ci-cd.yml** | Pipeline principal con 6 jobs automáticos |

### En la carpeta `.github/`

| Archivo | Descripción |
|---------|-------------|
| **dependabot.yml** | Actualización automática de dependencias |
| **GITHUB-ACTIONS-SETUP.md** | Guía de configuración y secretos |
| **ADVANCED-CONFIGURATIONS.md** | Ejemplos de configuraciones avanzadas |
| **SECURITY-AND-CHECKLIST.md** | Checklist de seguridad y mejores prácticas |
| **README.md** | Este archivo |

---

## 🔄 Pipeline de Ejecución

```
┌─────────────────────────────────────────────────────────────────┐
│                     Trigger en GitHub                           │
│  • Push a main/develop • Pull Requests • Ejecución manual       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   ┌────▼─────────────┐      ┌───────▼──────────────┐
   │  Backend Tests   │      │  Frontend Build      │
   │  (Maven/Java)    │      │  (Node/React/Vite)   │
   └────┬─────────────┘      └───────┬──────────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
              ┌────────▼─────────┐
              │  Security Audit  │
              │  (Vulnerab.)     │
              └────────┬─────────┘
                       │
              ┌────────▼─────────┐
              │  Build Docker    │
              │  (Container)     │
              └────────┬─────────┘
                       │
                ┌──────▼──────┐
                │  Deploy to  │
                │  Render     │
                │ (solo main) │
                └─────────────┘
```

---

## 🎯 Características Principales

### ✅ Validación Automática
- ✓ Tests unitarios (Java con Maven)
- ✓ Build del proyecto
- ✓ Compilación del frontend (React/Vite)
- ✓ Auditoría de seguridad (dependencias vulnerables)
- ✓ Análisis de código limpio

### ✅ Integración Continua
- ✓ Ejecuta en cada push y pull request
- ✓ Detiene el pipeline en primer error
- ✓ Cache de dependencias para rapidez
- ✓ Reportes de pruebas

### ✅ Despliegue Continuo
- ✓ Construcción automática de imagen Docker
- ✓ Deploy automático a Render (rama main)
- ✓ Versionado inteligente de artefactos
- ✓ Notificaciones de estado

### ✅ Seguridad
- ✓ Manejo seguro de credenciales (GitHub Secrets)
- ✓ Auditoría de vulnerabilidades
- ✓ Ramas protegidas
- ✓ Logs completos

---

## ⚙️ Configuración Rápida

### Paso 1: Verificar Archivos
```bash
# Asegúrate de que existan estos archivos
ls -la .github/workflows/ci-cd.yml
ls -la .github/dependabot.yml
```

### Paso 2: Agregar Secrets
1. Ve a **GitHub** → Tu repositorio → **Settings** → **Secrets and variables** → **Actions**
2. Haz clic en **New repository secret**
3. Agrega:

```
RENDER_DEPLOY_HOOK = https://api.render.com/deploy/... (obtener de Render)
```

### Paso 3: Configurar Rama Protegida (Recomendado)
1. **Settings** → **Branches** → **Add rule**
2. Pattern: `main`
3. Habilita:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass

### Paso 4: Hacer Push
```bash
git add .
git commit -m "chore: agregar GitHub Actions CI/CD pipeline"
git push origin main
```

### Paso 5: Verificar
Ve a tu repositorio → **Actions** y observa el workflow ejecutarse

---

## 📊 Estados del Pipeline

| Estado | Significado | Acción |
|--------|------------|--------|
| ✅ **Success** | Todo pasó correctamente | ¡Ninguna! |
| ❌ **Failed** | Algo falló | Revisa logs del job que falló |
| ⏳ **In Progress** | Ejecutándose | Espera o abre en otra pestaña |
| ⊘ **Cancelled** | Cancelado manualmente | Reinicia si es necesario |
| ⚠️ **Warning** | Advertencias no críticas | Revisa pero puedes ignorar |

---

## 🔧 Solución de Problemas

### Backend tests fallan
```bash
# Ejecuta localmente para reproducir
cd Soyla
mvn test

# Revisa el error y corrige en tu código
```

### Frontend build falla
```bash
# Verifica las dependencias
cd Soyla/Frontend
npm install

# Intenta compilar
npm run build
```

### Docker build falla
```bash
# Verifica que el Dockerfile exista
ls -la Soyla/Dockerfile

# Intenta compilar localmente
docker build -t soyla:test -f Soyla/Dockerfile .
```

### Deploy no se ejecuta
- Verifica que `RENDER_DEPLOY_HOOK` esté configurado
- Asegúrate de hacer push a `main`
- Verifica que los jobs anteriores pasaron

---

## 📈 Próximas Mejoras Sugeridas

1. **Notificaciones Slack** - Alertas en tiempo real
2. **SonarQube Analysis** - Análisis de código profesional
3. **Load Tests** - Pruebas de rendimiento
4. **Multi-environment Deploy** - Staging y production
5. **Backup Automático** - Respaldar antes de deploy
6. **Rollback Automático** - Revertir en caso de falla

Ver [ADVANCED-CONFIGURATIONS.md](ADVANCED-CONFIGURATIONS.md) para implementar estas mejoras.

---

## 📚 Documentación Relacionada

| Documento | Propósito |
|-----------|-----------|
| [GITHUB-ACTIONS-SETUP.md](GITHUB-ACTIONS-SETUP.md) | Guía detallada de setup |
| [ADVANCED-CONFIGURATIONS.md](ADVANCED-CONFIGURATIONS.md) | Ejemplos avanzados |
| [SECURITY-AND-CHECKLIST.md](SECURITY-AND-CHECKLIST.md) | Seguridad y checklist |

---

## 🔐 Seguridad

- ✅ **Secrets encriptados** en GitHub
- ✅ **Permisos mínimos** en cada job
- ✅ **Auditoría de dependencias** automática
- ✅ **Validación de código** antes de desplegar

**Nunca** escribas secretos directamente en el workflow. Usa GitHub Secrets.

---

## 📊 Métricas y Monitoreo

### Acceder al Dashboard
1. **GitHub** → Tu repositorio → **Actions**
2. Selecciona **CI/CD Pipeline - Soyla**
3. Observa:
   - Duración de ejecución
   - Trabajos que fallan frecuentemente
   - Patrones de error

### Descargar Reportes
1. Abre el último workflow
2. Baja a **Artifacts**
3. Descarga:
   - `backend-test-reports/` - Reportes de pruebas
   - `frontend-build/` - Artefactos del frontend

---

## 💡 Buenas Prácticas Implementadas

- ✅ Separación clara de responsabilidades (jobs)
- ✅ Caché de dependencias (Maven, npm)
- ✅ Fail-fast strategy (detener al primer error)
- ✅ Nombres descriptivos
- ✅ Documentación inline
- ✅ Condiciones inteligentes (if statements)
- ✅ Manejo de errores robusto
- ✅ Concurrencia controlada (cancel-in-progress)

---

## 🚀 Ejecución Manual

Si necesitas ejecutar el workflow manualmente:

1. Ve a **Actions** → **CI/CD Pipeline**
2. Haz clic en **Run workflow**
3. Selecciona la rama
4. Haz clic en **Run workflow**

---

## 📝 Convenciones de Commits

Para mejor seguimiento en los logs:

```bash
# Commits que activan el workflow
feat(backend): nueva funcionalidad        # Feature
fix(frontend): corregir bug              # Bug fix
chore(deps): actualizar dependencias     # Mantenimiento

# Estos también desencadenan
docs: actualizar documentación
test: agregar tests
refactor: reorganizar código
```

---

## 🤝 Contribuciones

Cuando abras un Pull Request:

1. El workflow se ejecuta automáticamente
2. Todos los checks deben pasar (✅)
3. Se genera reporte de cambios
4. Luego de review, puedes hacer merge

---

## ❓ Preguntas Frecuentes

**P: ¿Con qué frecuencia se ejecuta?**
A: Cada vez que haces push o abres/actualizas un PR.

**P: ¿Puedo ver los logs?**
A: Sí, en **Actions** → Workflow → Job → Logs.

**P: ¿Qué pasa si falla?**
A: Se bloquea el merge a main. Corrige y haz push nuevamente.

**P: ¿Cuánto cuesta?**
A: GitHub Actions es gratuito para repos públicos. Privados: 2,000 minutos/mes gratis.

**P: ¿Cómo agrego más validaciones?**
A: Ve a [ADVANCED-CONFIGURATIONS.md](ADVANCED-CONFIGURATIONS.md).

---

## 📞 Soporte

- 📖 Documentación oficial: https://docs.github.com/en/actions
- 🔍 Marketplace: https://github.com/marketplace?type=actions
- 💬 Comunidad: https://github.community

---

## 📄 Licencia

Esta configuración de GitHub Actions es parte del proyecto Soyla y sigue la misma licencia.

---

## 🎉 ¡Listo!

Tu pipeline CI/CD está configurado y operacional. 

**Próximos pasos:**
1. ✅ Hacer push a `main`
2. ✅ Ver el workflow ejecutarse en **Actions**
3. ✅ Disfrutar de despliegues automáticos

¡Buena suerte! 🚀
