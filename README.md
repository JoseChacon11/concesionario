# 🏍️ MotoDealer SaaS - Sistema Multi-tenant para Concesionarios

Sistema completo de gestión para concesionarios de motos con multi-tenancy, construido con Next.js 14 y Supabase.

## ✨ Características Principales

### 🔐 Autenticación y Multi-tenancy
- Sistema de autenticación con Supabase Auth
- Aislamiento completo de datos por concesionario (Row Level Security)
- Cada concesionario tiene su propio dashboard y landing page público

### 📊 Dashboard de Administración
- **Categorías y Subcategorías**: CRUD completo con jerarquía
  - Motos, Accesorios, Repuestos
  - Subcategorías personalizadas (Clásicas, Scooters, Cascos, etc.)
- **Productos**: Gestión completa de inventario
  - Formularios dinámicos según categoría
  - Múltiples imágenes por producto
  - Campos específicos para motos (marca, modelo, año)
  - Estados: Disponible, Vendido, Reservado
- **Empleados**: Gestión del equipo
  - Fotos y datos de contacto
  - Integración directa con WhatsApp
- **Configuración del Sitio**: Personalización completa
  - Logo y banner hero
  - Colores corporativos
  - Footer con redes sociales
  - Información de contacto

### 🌐 Landing Page Público
- **Header**: Logo personalizable
- **Hero Banner**: Imagen y textos editables
- **Filtros Avanzados**: 
  - Búsqueda por texto
  - Categorías y subcategorías
  - Rango de precios
- **Catálogo de Productos**: 
  - Tarjetas dinámicas según tipo de producto
  - Imágenes, precios, descripciones
  - Estados visuales (Disponible, Vendido, Reservado)
- **Carrito Temporal**: 
  - Agregar múltiples productos
  - Consulta directa por WhatsApp
- **Sección de Empleados**: 
  - Fotos del equipo
  - Botones de contacto directo
- **Footer Personalizado**: 
  - Información de contacto
  - Enlaces a redes sociales
  - Texto personalizado

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Lenguaje**: JavaScript/JSX
- **Iconos**: Lucide React

## 📦 Estructura del Proyecto

```
/app
├── app/
│   ├── login/                    # Página de login
│   ├── dashboard/                # Dashboard admin
│   │   ├── layout.js            # Layout con sidebar
│   │   ├── page.js              # Dashboard principal
│   │   ├── categories/          # CRUD Categorías
│   │   ├── products/            # CRUD Productos
│   │   ├── employees/           # CRUD Empleados
│   │   └── settings/            # Configuración del sitio
│   └── catalogo/[slug]/         # Landing page público
├── components/
│   ├── ui/                      # Componentes shadcn/ui
│   └── dashboard/               # Componentes del dashboard
├── contexts/
│   └── DealershipContext.js    # Context para multi-tenancy
├── lib/
│   └── supabase/               # Cliente Supabase
├── middleware.js                # Auth middleware
└── supabase-schema.sql         # Esquema de base de datos
```

## 🗄️ Esquema de Base de Datos

### Tablas Principales
- `dealerships`: Información de cada concesionario
- `users`: Usuarios vinculados a concesionarios
- `categories`: Categorías principales
- `subcategories`: Subcategorías
- `products`: Productos con campos dinámicos
- `product_images`: Múltiples imágenes por producto
- `employees`: Equipo de trabajo
- `site_settings`: Configuración personalizable del landing

### Storage Buckets
- `motorcycles`: Imágenes de productos
- `site-assets`: Logos, banners, fotos de empleados

## 🔧 Configuración Inicial

### 1. Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_BASE_URL=tu_url_produccion
```

### 2. Ejecutar SQL en Supabase
1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Ejecuta el contenido de `supabase-schema.sql`

### 3. Crear Storage Buckets
1. Ve a Storage en Supabase
2. Crea bucket `motorcycles` (público)
3. Crea bucket `site-assets` (público)
4. Configura políticas:
   - Lectura: Permitir a todos
   - Escritura: Solo usuarios autenticados

### 4. Crear Usuarios
En Supabase Auth → Users, crea usuarios manualmente.
Cada usuario debe estar vinculado a un dealership en la tabla `users`.

## 👥 Usuarios de Prueba

### Motos Táchira
- **Email**: motostachira@gmail.com
- **User UID**: 2d19cddb-afce-48c4-a073-9960078111d4
- **Landing**: /catalogo/motostachira

### Eklas Vegas
- **Email**: eklasvegas@gmail.com
- **User UID**: 75481ae8-1e79-4ed7-bc61-e14000a5565c
- **Landing**: /catalogo/eklasvegas

## 🌐 URLs del Sistema

### Administración
- **Login**: `/login`
- **Dashboard**: `/dashboard`
- **Categorías**: `/dashboard/categories`
- **Productos**: `/dashboard/products`
- **Empleados**: `/dashboard/employees`
- **Configuración**: `/dashboard/settings`

### Landing Pages Públicos
- **Motos Táchira**: `/catalogo/motostachira`
- **Eklas Vegas**: `/catalogo/eklasvegas`

## 📱 Funcionalidades de WhatsApp

### Contacto con Empleados
Botón directo que abre WhatsApp con el número del empleado.

### Carrito de Consulta
El usuario puede agregar productos al carrito y enviar una consulta completa por WhatsApp con todos los productos seleccionados.

### Formato de Mensaje
```
Hola! Estoy interesado en los siguientes productos:

• Honda CBR 500 (1x) - $8,500
• Casco Integral (2x) - $150

¿Podrían darme más información?
```

## 🎨 Personalización

### Logo y Branding
- Subir logo desde Dashboard → Configuración → Branding
- Personalizar colores primario y secundario
- Todo se refleja automáticamente en el landing público

### Hero Banner
- Imagen de fondo personalizable
- Título y subtítulo editables
- Ideal para promociones o mensajes destacados

### Footer
- Dirección, teléfono, email
- Enlaces a redes sociales (Facebook, Instagram, Twitter, TikTok, YouTube)
- Texto personalizado de copyright

## 🔒 Seguridad (Row Level Security)

Todas las tablas tienen políticas RLS activas:
- Los datos se aíslan automáticamente por `dealership_id`
- Los usuarios solo pueden ver/editar datos de su propio concesionario
- El landing público es accesible para todos (solo lectura)

## 📊 Características del Catálogo

### Filtros Avanzados
- **Búsqueda**: Por nombre de producto
- **Categoría**: Motos, Accesorios, Repuestos
- **Subcategoría**: Dinámico según categoría seleccionada
- **Precio**: Rango mínimo y máximo

### Tarjetas de Producto
Las tarjetas se adaptan según el tipo:
- **Motos**: Muestra marca, modelo, año
- **Accesorios/Repuestos**: Solo nombre, precio, descripción

### Estados Visuales
- 🟢 **Disponible**: Badge verde
- 🔴 **Vendido**: Badge rojo (no se puede agregar al carrito)
- 🟡 **Reservado**: Badge amarillo

## 🛠️ Próximas Mejoras Sugeridas

### Super Admin Dashboard
- Ver todos los concesionarios
- Habilitar/deshabilitar concesionarios
- Estadísticas globales

### Estadísticas
- Productos más vistos
- Consultas por WhatsApp
- Análisis de inventario

### Mejoras UX
- Vista detallada de producto con galería
- Comparador de productos
- Favoritos

## 📝 Notas Importantes

1. **Contraseñas**: Las contraseñas de los usuarios de prueba deben configurarse en Supabase Auth.

2. **Storage Policies**: Asegúrate de configurar correctamente las políticas de los buckets para permitir:
   - Lectura pública (para mostrar imágenes en el landing)
   - Escritura solo para usuarios autenticados

3. **Slugs Únicos**: Cada concesionario debe tener un slug único para su landing page.

4. **Formato de WhatsApp**: Los números de teléfono deben incluir el código de país (ej: +58 414 123 4567).

## 🎯 Flujo de Uso Típico

1. **Administrador ingresa** → Login con credenciales
2. **Crea categorías** → Motos, Accesorios, Repuestos
3. **Crea subcategorías** → Clásicas, Scooters, Cascos, etc.
4. **Agrega productos** → Con fotos, precios, descripciones
5. **Configura empleados** → Equipo con fotos y WhatsApp
6. **Personaliza landing** → Logo, colores, hero banner, footer
7. **Comparte URL pública** → `/catalogo/[slug]` con clientes

## 🚀 Deploy

El sistema está diseñado para funcionar en cualquier plataforma que soporte Next.js:
- Vercel (recomendado)
- Netlify
- Railway
- Docker

Asegúrate de configurar las variables de entorno en tu plataforma de deploy.

## 📄 Licencia

Este es un proyecto privado para uso de concesionarios de motos.

---

**Desarrollado con ❤️ usando Next.js 14 y Supabase**
