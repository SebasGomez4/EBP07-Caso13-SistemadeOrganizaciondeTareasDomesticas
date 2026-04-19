# Logo de Soyla - Sistema de Gestión de Tareas Domésticas

## Concepto de Diseño

El logo combina elementos visuales que representan el núcleo de la aplicación:
- **Casa**: Representa el hogar y el entorno doméstico
- **Check mark**: Simboliza tareas completadas y organización
- **Elementos de lista**: Puntos sutiles que sugieren una lista de tareas

## Características del Diseño

### Estilo Visual
- **Minimalista**: Formas geométricas simples y limpias
- **Moderno**: Diseño SVG escalable sin detalles innecesarios
- **Coherente**: Usa los colores del sistema (gradiente purple-600 a blue-600)

### Paleta de Colores
- **Primario**: Purple-600 (`#9333EA`) - Casa
- **Secundario**: Blue-500 (`#3B82F6`) - Check mark
- **Acento**: Purple-400 (`#C084FC`) - Elementos de lista

### Composición
```
┌─────────────────────────┐
│   🏠✓  Soyla            │
│   Sistema de gestión... │
└─────────────────────────┘
```

## Variantes del Logo

### 1. Horizontal (Default)
Incluye icono + nombre + tagline (opcional)
```tsx
<AppLogo size="md" showTagline={true} variant="horizontal" />
```

**Uso recomendado:**
- Pantalla de login
- Pantalla de registro
- Páginas de marketing
- Footer

### 2. Solo Icono
Icono independiente sin texto
```tsx
<AppLogo size="sm" showTagline={false} variant="icon" />
```

**Uso recomendado:**
- Navbar/Header
- Favicon
- App icons
- Espacios reducidos

## Tamaños Disponibles

### Small (sm)
- **Icono**: 32x32px (w-8 h-8)
- **Texto**: text-3xl
- **Uso**: Navbar, headers compactos

### Medium (md)
- **Icono**: 40x40px (w-10 h-10)
- **Texto**: text-4xl
- **Uso**: Login, registro, páginas principales

### Large (lg)
- **Icono**: 48x48px (w-12 h-12)
- **Texto**: text-5xl
- **Uso**: Landing pages, pantallas de bienvenida

## Implementación Técnica

### Componente React
```tsx
import { AppLogo } from "./components/AppLogo";

// Ejemplo: Navbar
<AppLogo size="sm" showTagline={false} variant="icon" />

// Ejemplo: Login
<AppLogo size="lg" showTagline={true} variant="horizontal" />
```

### Estructura SVG
El icono está construido con:
1. **Path principal**: Forma de casa (fill purple-600)
2. **Path check**: Marca de verificación (stroke blue-500)
3. **Círculos**: Elementos de lista (fill purple-400)

### Escalabilidad
- SVG vectorial: escala sin pérdida de calidad
- Sin dependencias externas
- Tamaño de archivo mínimo
- Compatible con todos los navegadores modernos

## Lineamientos de Uso

### ✅ Hacer
- Usar los tamaños predefinidos (sm, md, lg)
- Mantener proporciones originales
- Usar sobre fondos claros (white, purple-50, blue-50)
- Dejar espacio respirable alrededor del logo

### ❌ No Hacer
- No modificar los colores del logo
- No distorsionar las proporciones
- No añadir efectos de sombra pesados
- No usar sobre fondos oscuros sin ajustar

## Accesibilidad

- **Contraste**: Cumple con WCAG 2.1 AA sobre fondos claros
- **Legibilidad**: Texto sans-serif legible a todos los tamaños
- **Semántica**: Implementado como elemento de marca (h1/div)

## Coherencia con el Sistema

El logo mantiene coherencia con:
- **Colores**: Gradiente purple-600 to blue-600 (usado en botones, headers)
- **Tipografía**: Sans-serif moderna (mismo estilo que la UI)
- **Estilo**: Minimalista y limpio (coherente con Cards, Inputs, Buttons)
- **Espaciado**: Gap consistente con el sistema de diseño

## Recursos

### Archivos
- Componente: `/src/app/components/AppLogo.tsx`
- Implementación: React + TypeScript + Tailwind CSS

### Colores Exactos
```css
purple-600: #9333EA
purple-400: #C084FC
blue-600: #2563EB
blue-500: #3B82F6
```

## Ejemplos de Integración

### Navbar
```tsx
<div className="bg-white/40 backdrop-blur-sm border-b">
  <div className="container mx-auto px-6 py-4 flex items-center justify-between">
    <AppLogo size="sm" showTagline={false} variant="icon" />
    {/* Otros elementos del navbar */}
  </div>
</div>
```

### Login Screen
```tsx
<div className="text-center mb-12">
  <AppLogo size="lg" showTagline={true} variant="horizontal" />
</div>
```

### Favicon (concepto)
Para generar un favicon, exportar la variante "icon" en tamaño 32x32px o 48x48px como PNG/ICO.

---

**Diseño creado para**: Soyla - Sistema de Gestión de Tareas Domésticas  
**Versión**: 1.0  
**Última actualización**: 2026
