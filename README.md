# 🏍️ Speed Rao Motos - Progressive Web App (PWA)

Aplicación Web Progresiva ultraliviana y de alto rendimiento diseñada para **Speed Rao Motos** (Venta de repuestos, accesorios y taller de reparaciones de motocicletas en Bolivia).

---

## 🚀 Tecnologías Principales

- **Frontend**: React + Vite (Carga perezosa con `React.lazy` + `Suspense`)
- **Estilos**: Tailwind CSS (Sin librerías UI pesadas)
- **Base de Datos, Auth y Storage**: Supabase (Postgres)
- **Inteligencia Artificial para PDFs**: Gemini API (`@google/generative-ai`)
- **Hosting**: Vercel
- **PWA / Cache Offline**: `vite-plugin-pwa` con Workbox (*Cache First* para assets, *Network First* para datos dinámicos)
- **Moneda e Idioma**: Bolivianos (Bs.) - Español (Bolivia)

---

## 🔑 Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
VITE_GEMINI_API_KEY=tu-api-key-de-google-gemini
```

---

## 🗄️ Configuración de Base de Datos en Supabase

1. Entra a tu proyecto en [Supabase Console](https://supabase.com/).
2. Ve al apartado **SQL Editor**.
3. Copia y ejecuta todo el contenido del archivo [`supabase_schema.sql`](./supabase_schema.sql).
4. En **Storage**, crea un bucket público llamado `products` (para las imágenes WebP optimizadas de los repuestos).

---

## 👥 Control de Roles y Acceso

- **ADMINISTRADOR**:
  - Para crear el usuario administrador inicial, regístrate en la app o en Supabase Auth y cambia el campo `role` a `'admin'` y `status` a `'active'` en la tabla `profiles` desde Supabase Table Editor.
  - Tiene acceso a la gestión de vendedores (aprobar/suspender), inventario, ventas y reparaciones.
- **VENDEDORES**:
  - Se registran mediante la pantalla de registro (`/registro`).
  - Su cuenta se crea en estado `pendiente`.
  - El administrador debe aprobar la cuenta desde la vista `/admin/usuarios` para activar el acceso.

---

## 🛠️ Comandos de Desarrollo y Compilación

```bash
# Instalación de dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Compilar producción optimizada (PWA)
npm run build

# Previsualizar build de producción
npm run preview
```

---

## ⚡ Principios de Rendimiento Aplicados

1. **Cero librerías pesadas**: Diseñado desde cero con utilidades Tailwind CSS.
2. **Lazy Loading de Rutas**: Cada módulo (`/inventario`, `/ventas`, `/reparaciones`, `/pdf-ai`, `/admin`) se descarga bajo demanda.
3. **Optimización de Imágenes WebP**: Compresión automática en el navegador mediante HTML5 Canvas antes de subir a Supabase.
4. **Paginación en Servidor**: Consultas por rango en Supabase para manejar catálogos con cientos de repuestos sin saturar la red.
5. **Estrategia PWA Offline**: Service Worker configurado con Workbox para trabajar con conexión lenta o inestable en talleres.
