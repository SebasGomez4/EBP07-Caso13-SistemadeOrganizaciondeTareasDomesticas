# 🔐 Seguridad y Checklist de GitHub Actions

## ✅ Checklist de Verificación Post-Setup

### 1. Configuración Inicial
- [ ] Archivo `.github/workflows/ci-cd.yml` creado
- [ ] Archivo `.github/dependabot.yml` creado
- [ ] Archivo `.github/GITHUB-ACTIONS-SETUP.md` revisado

### 2. GitHub Secrets Configurados
- [ ] `RENDER_DEPLOY_HOOK` agregado (si usas Render)
- [ ] `GITHUB_TOKEN` disponible (automático)
- [ ] Otros secrets configurados según necesidad

### 3. Ramas Protegidas Configuradas
- [ ] `main` requiere que pasen todos los checks de CI/CD
- [ ] `develop` requiere validación (opcional)
- [ ] Revisiones requeridas antes de merge

### 4. Permisos de Repositorio
- [ ] Actions está habilitado
- [ ] Workflows tiene permisos de escritura (para reportes)
- [ ] Dependabot está habilitado

### 5. Primer Despliegue
- [ ] Push a `main` para activar el workflow
- [ ] Verificar que todos los jobs pasen
- [ ] Revisar logs en Actions

---

## 🔐 Mejores Prácticas de Seguridad

### 1. Gestión de Secretos

#### ✅ CORRECTO
```yaml
# Usar secrets para credenciales
- name: Deploy
  run: curl -X POST ${{ secrets.DEPLOY_HOOK }}

# Usar environment protection rules
environment:
  name: production
  url: https://soyla-api.onrender.com
```

#### ❌ INCORRECTO
```yaml
# NO: Escribir secretos en el workflow
- run: curl -X POST https://example.com/deploy?token=abc123

# NO: Hardcodear contraseñas
env:
  DATABASE_PASSWORD: "mypassword123"
```

### 2. Permiso Mínimo (Least Privilege)

```yaml
# Especificar permisos exactos requeridos
permissions:
  contents: read          # Solo lectura
  packages: write         # Escribir en registro
  pull-requests: write    # Escribir comentarios en PR
  # ❌ NO usar 'permissions: write-all'
```

### 3. Checkout Seguro

```yaml
# ✅ CORRECTO: Especificar versión y fetch-depth
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.GITHUB_TOKEN }}

# ❌ EVITAR: Checkout sin versión
- uses: actions/checkout@master  # Unsafe
```

### 4. Auditoría de Dependencias

```yaml
# Verificar vulnerabilidades regularmente
- name: Security Audit
  run: |
    cd Soyla/Frontend
    npm audit --audit-level=moderate
    
    cd ../
    mvn org.owasp:dependency-check-maven:check
```

### 5. Validación de Artefactos

```yaml
# Verificar integridad de artefactos
- name: Verify Build Integrity
  run: |
    if [ ! -f "Soyla/target/soyla-*.jar" ]; then
      echo "❌ JAR no encontrado. Build falló."
      exit 1
    fi
```

---

## 📋 Reglas de Rama Protegida

Para mayor seguridad, configura reglas de rama protegida:

### 1. Ve a Settings → Branches → Add rule

### 2. Configura para `main`:

```
Pattern name: main

✅ Require a pull request before merging
   ├─ Require approvals: 1
   ├─ Require conversation resolution: ✓
   └─ Require status checks to pass before merging
      ├─ backend-validation
      ├─ frontend-validation
      ├─ build-docker
      └─ deploy-render

✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
✅ Include administrators
✅ Restrict who can push to matching branches (opcional)
```

---

## 🔍 Auditoría de Workflows

### Revisión Regular

Cada mes, revisa:

1. **Historial de Actions**
   ```
   Repositorio → Actions → Todos los workflows
   ```

2. **Búsqueda de Fallos**
   - Identifica patrones de errores
   - Actualiza dependencias que causen problemas
   - Documenta soluciones

3. **Análisis de Tiempos**
   - ¿Tarda más de lo esperado?
   - ¿Hay recursos desperdiciados?
   - ¿Necesita cache mejor?

4. **Secretos Expuestos**
   ```bash
   # Buscar en logs accidentalmente expuestos
   git log --grep="SECRET\|PASSWORD\|TOKEN" --all
   ```

---

## 🚨 Incidentes de Seguridad

### Si se expone un secreto:

1. **Acción Inmediata**
   ```
   1. Revoca el secreto/token
   2. Crea uno nuevo
   3. Actualiza en GitHub Secrets
   4. Audita logs para acceso no autorizado
   ```

2. **Limpiar Historio de Git**
   ```bash
   # CUIDADO: Reescribe historio
   git filter-branch --tree-filter "grep -r 'SECRET' && exit 1 || exit 0"
   ```

3. **Reportar**
   - Documenta qué secreto fue expuesto
   - Cuándo se descubrió
   - Acciones tomadas

---

## 📊 Monitoreo y Alertas

### Configurar Alertas en GitHub

1. Ve a **Settings → Security & analysis**

2. Habilita:
   ```
   ✅ Dependabot alerts
   ✅ Dependabot security updates
   ✅ Secret scanning
   ✅ Push protection (if available)
   ```

3. Configura notificaciones:
   ```
   Settings → Notifications → Security alerts
   ```

---

## 🔄 Rotación de Secretos

### Cada 90 días:

```bash
# 1. Generar nuevo secret
# 2. Actualizar en GitHub Secrets
# 3. Actualizar en el servicio (Render, etc.)
# 4. Revocar secret antiguo
# 5. Verificar que workflows funcionen
```

---

## 📝 Compliance y Auditoría

### Requisitos Comunes

#### SOC 2 / ISO 27001
- ✅ Todas las acciones auditadas
- ✅ Secrets encriptados
- ✅ Acceso controlado
- ✅ Logs retenidos

#### Implementación
```yaml
# Documentar en commit messages
- "chore: renovar secret DEPLOY_HOOK"
- "chore: actualizar policy de branch protection"

# Mantener changelog
# Archivos: SECURITY-AUDIT.log, DEPLOY-LOG.md
```

---

## 🛡️ Validaciones de Código

### Pre-commit Hooks (Opcional)

Instala en tu máquina local:

```bash
# Prevenir commits con secretos
npm install -g detect-secrets
detect-secrets scan --all-files > .detects.baseline

# Validator de Conventional Commits
npm install --save-dev husky
husky install
```

---

## 📚 Recursos de Seguridad

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP CI/CD Security](https://owasp.org/www-project-devsecops-guideline/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Supply Chain Security](https://slsa.dev/)

---

## 🎯 Próximos Pasos

1. **Corto Plazo** (1-2 semanas)
   - [ ] Completar checklist de verificación
   - [ ] Ejecutar primer workflow exitoso
   - [ ] Configurar alertas

2. **Mediano Plazo** (1-2 meses)
   - [ ] Agregar SonarQube o análisis de código
   - [ ] Configurar notificaciones Slack
   - [ ] Implementar dependency scanning

3. **Largo Plazo** (2-6 meses)
   - [ ] Implementar SBOM (Software Bill of Materials)
   - [ ] Agregar tests de seguridad específicos
   - [ ] Establecer compliance framework

---

## 💬 Soporte y Ayuda

Si encuentras problemas:

1. **Revisa los logs** de GitHub Actions
2. **Consulta** la documentación oficial
3. **Busca en GitHub Issues** del proyecto
4. **Crea issue** con:
   - Workflow file (`ci-cd.yml`)
   - Logs de error
   - Contexto de la falla
