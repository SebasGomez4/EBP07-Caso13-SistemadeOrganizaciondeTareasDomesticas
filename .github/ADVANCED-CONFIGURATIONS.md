# 🔧 Configuraciones Avanzadas de GitHub Actions

Este archivo contiene ejemplos de configuraciones adicionales que puedes implementar en el futuro.

---

## 1️⃣ MATRIX BUILD - Probar en Múltiples Versiones

Si deseas probar tu aplicación en múltiples versiones de Java y Node.js:

```yaml
jobs:
  backend-validation:
    name: 🔧 Backend Validation
    runs-on: ubuntu-latest
    strategy:
      matrix:
        java-version: ['17', '21']  # Prueba en 2 versiones
        os: [ubuntu-latest, windows-latest]  # Múltiples SOs
      fail-fast: false  # Continúa incluso si una falla

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: ${{ matrix.java-version }}
          distribution: 'temurin'
          cache: maven
      
      - run: cd Soyla && mvn test
```

---

## 2️⃣ NOTIFICACIONES EN SLACK

Agrega notificaciones cuando el workflow falla:

```yaml
  slack-notification:
    name: 📢 Notify Slack
    runs-on: ubuntu-latest
    if: failure()
    needs: [backend-validation, frontend-validation, build-docker]

    steps:
      - name: Send Slack Notification
        uses: slackapi/slack-github-action@v1.24.0
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "❌ CI/CD Pipeline Failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*CI/CD Pipeline Failed* for ${{ github.repository }}"
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {
                      "type": "mrkdwn",
                      "text": "*Branch:*\n${{ github.ref_name }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Author:*\n${{ github.actor }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Commit:*\n${{ github.sha }}"
                    }
                  ]
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "View Details"
                      },
                      "url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                    }
                  ]
                }
              ]
            }
```

Para configurar:
1. Crea un Webhook en Slack: https://api.slack.com/messaging/webhooks
2. Agrega `SLACK_WEBHOOK` a GitHub Secrets

---

## 3️⃣ COVERAGE DE TESTS CON SONARQUBE

Para análisis de calidad de código avanzado:

```yaml
  sonar-analysis:
    name: 📊 SonarQube Analysis
    runs-on: ubuntu-latest
    needs: [backend-validation]

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Run SonarQube Scan
        working-directory: Soyla
        run: |
          mvn clean verify sonar:sonar \
            -Dsonar.projectKey=soyla \
            -Dsonar.host.url=${{ secrets.SONAR_HOST_URL }} \
            -Dsonar.login=${{ secrets.SONAR_TOKEN }}
```

---

## 4️⃣ ARTIFACT BUILD CON VERSIONADO AUTOMÁTICO

Para versionar automáticamente el build:

```yaml
jobs:
  build-versioned-artifact:
    name: 📦 Build Versioned Artifact
    runs-on: ubuntu-latest
    needs: [backend-validation, frontend-validation]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Generate Version
        id: version
        run: |
          VERSION=$(date +'%Y.%m.%d.%H%M')-${{ github.sha:0:7 }}
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Build with Version
        working-directory: Soyla
        run: |
          mvn versions:set -DnewVersion=${{ steps.version.outputs.version }}
          mvn clean package -DskipTests

      - name: Upload JAR Artifact
        uses: actions/upload-artifact@v3
        with:
          name: soyla-${{ steps.version.outputs.version }}.jar
          path: Soyla/target/soyla-*.jar
          retention-days: 30
```

---

## 5️⃣ DEPLOY MULTI-AMBIENTE

Para deployar a diferentes ambientes según la rama:

```yaml
  deploy:
    name: 🚀 Deploy
    runs-on: ubuntu-latest
    needs: [build-docker]
    if: github.event_name == 'push'

    strategy:
      matrix:
        include:
          - branch: develop
            environment: staging
            deploy-hook: ${{ secrets.RENDER_STAGING_HOOK }}
          
          - branch: main
            environment: production
            deploy-hook: ${{ secrets.RENDER_PRODUCTION_HOOK }}

    environment:
      name: ${{ matrix.environment }}
      url: ${{ matrix.environment == 'production' && 'https://soyla-api.onrender.com' || 'https://soyla-staging.onrender.com' }}

    steps:
      - name: 🎯 Deploy to ${{ matrix.environment }}
        if: github.ref == format('refs/heads/{0}', matrix.branch)
        run: curl -X POST ${{ matrix.deploy-hook }}
```

---

## 6️⃣ VALIDACIÓN AUTOMÁTICA DE COMMITS

Para asegurar formato de commits correcto:

```yaml
jobs:
  commit-validation:
    name: ✅ Validate Commits
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Validate Commit Messages
        run: |
          # Valida que los commits sigan Conventional Commits
          git log origin/main..HEAD --pretty=%B | grep -E '^(feat|fix|docs|style|refactor|test|chore):' || {
            echo "❌ Commits deben seguir Conventional Commits format"
            echo "Ejemplos válidos:"
            echo "  - feat: nueva característica"
            echo "  - fix: corrección de bug"
            echo "  - docs: actualización de documentación"
            exit 1
          }
```

---

## 7️⃣ DEPENDENCY UPDATE AUTOMÁTICO

Mantén dependencias actualizadas con Dependabot:

```yaml
# .github/dependabot.yml
version: 2
updates:
  # Backend Dependencies
  - package-ecosystem: "maven"
    directory: "/Soyla"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    open-pull-requests-limit: 5
    assignees:
      - "@username"
    labels:
      - "dependencies"
      - "java"

  # Frontend Dependencies
  - package-ecosystem: "npm"
    directory: "/Soyla/Frontend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "04:00"
    open-pull-requests-limit: 5
    assignees:
      - "@username"
    labels:
      - "dependencies"
      - "frontend"

  # Docker
  - package-ecosystem: "docker"
    directory: "/Soyla"
    schedule:
      interval: "weekly"
```

---

## 8️⃣ PERFORMANCE MONITORING

Para monitorear tiempos de ejecución:

```yaml
jobs:
  performance-check:
    name: ⚡ Performance Check
    runs-on: ubuntu-latest
    needs: [backend-validation, frontend-validation]

    steps:
      - uses: actions/checkout@v4

      - name: 📊 Report Workflow Timing
        run: |
          cat << EOF >> $GITHUB_STEP_SUMMARY
          # ⚡ Pipeline Performance Report
          
          | Job | Duration | Status |
          |-----|----------|--------|
          | Backend Validation | ${{ job.duration }} | ${{ job.status }} |
          | Frontend Validation | ${{ job.duration }} | ${{ job.status }} |
          | Build Docker | ${{ job.duration }} | ${{ job.status }} |
          EOF
```

---

## 9️⃣ ROLLBACK AUTOMÁTICO

Para revertir despliegues problemáticos:

```yaml
  rollback-on-failure:
    name: 🔄 Rollback on Failure
    runs-on: ubuntu-latest
    if: failure() && github.ref == 'refs/heads/main'
    needs: [deploy]

    steps:
      - name: 🔙 Trigger Rollback
        run: |
          curl -X POST ${{ secrets.RENDER_ROLLBACK_HOOK }}
          echo "Rollback iniciado"
```

---

## 🔟 SCHEDULE JOBS - Ejecución Programada

Para ejecutar tareas en horarios específicos:

```yaml
on:
  schedule:
    # Ejecuta cada lunes a las 2 AM UTC
    - cron: '0 2 * * 1'
    # Ejecuta diariamente a las 6 AM UTC
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  scheduled-backup:
    name: 💾 Scheduled Backup
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'

    steps:
      - name: Execute Backup
        run: echo "Ejecutando backup programado..."
```

---

## 📋 Resumen de Secretos Adicionales Requeridos

Si implementas estas configuraciones avanzadas, necesitarás agregar estos secretos:

| Secret | Propósito | Obligatorio |
|--------|-----------|------------|
| `SLACK_WEBHOOK` | Notificaciones en Slack | ❌ Opcional |
| `SONAR_HOST_URL` | URL del servidor SonarQube | ❌ Opcional |
| `SONAR_TOKEN` | Token de autenticación SonarQube | ❌ Opcional |
| `RENDER_STAGING_HOOK` | Deploy a staging | ❌ Opcional |
| `RENDER_PRODUCTION_HOOK` | Deploy a producción | ❌ Opcional |
| `RENDER_ROLLBACK_HOOK` | Rollback en caso de falla | ❌ Opcional |

---

## 🎯 Recomendaciones de Implementación

1. **Comienza Simple**: Usa el `ci-cd.yml` base primero
2. **Agrega Gradualmente**: Implementa características avanzadas según necesites
3. **Monitorea Resultados**: Observa los logs y ajusta según sea necesario
4. **Documenta Cambios**: Mantén un registro de qué configuraciones agregaste
5. **Prueba en rama develop**: Antes de implementar en main

---

## 📚 Enlaces Útiles

- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Contexts and Expressions](https://docs.github.com/en/actions/learn-github-actions/contexts)
- [Secrets Management](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
