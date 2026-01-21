-- ============================================
-- ESQUEMA COMPLETO SUPABASE - SAAS MULTI-TENANT CONCESIONARIOS
-- ============================================

-- 1. TABLA DE CONCESIONARIOS (Dealerships)
CREATE TABLE IF NOT EXISTS public.dealerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA DE USUARIOS (vincula auth.users con dealership)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dealership_id UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin', -- admin, employee, super_admin
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA DE CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Motos, Accesorios, Repuestos
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dealership_id, slug)
);

-- 4. TABLA DE SUBCATEGORÍAS
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  dealership_id UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Clásicas, Scooters, Cascos, etc.
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dealership_id, category_id, slug)
);

-- 5. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  
  -- Campos para motos
  brand TEXT,
  model TEXT,
  year INTEGER,
  
  -- Campos comunes
  price DECIMAL(10, 2),
  description TEXT,
  status TEXT DEFAULT 'available', -- available, sold, reserved
  
  -- Campos adicionales opcionales
  specifications JSONB, -- Para almacenar specs adicionales
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dealership_id, slug)
);

-- 6. TABLA DE IMÁGENES DE PRODUCTOS (múltiples imágenes por producto)
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  dealership_id UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABLA DE EMPLEADOS
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  photo_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABLA DE CONFIGURACIÓN DEL SITIO
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID UNIQUE REFERENCES public.dealerships(id) ON DELETE CASCADE,
  
  -- Branding
  logo_url TEXT,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  
  -- Footer
  footer_text TEXT,
  footer_address TEXT,
  footer_phone TEXT,
  footer_email TEXT,
  
  -- Redes sociales
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  
  -- WhatsApp principal
  main_whatsapp TEXT,
  
  -- Colores y personalización adicional
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#666666',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_dealership ON public.users(dealership_id);
CREATE INDEX IF NOT EXISTS idx_categories_dealership ON public.categories(dealership_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_dealership ON public.subcategories(dealership_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_products_dealership ON public.products(dealership_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_employees_dealership ON public.employees(dealership_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - MULTI-TENANCY
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para DEALERSHIPS (acceso público para landing, admin para modificar)
CREATE POLICY "Dealerships son visibles públicamente" ON public.dealerships
  FOR SELECT USING (is_active = true);

CREATE POLICY "Solo admins pueden actualizar su dealership" ON public.dealerships
  FOR UPDATE USING (
    id IN (
      SELECT dealership_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Políticas para USERS
CREATE POLICY "Usuarios pueden ver su propia info" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar su propia info" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Políticas para CATEGORIES
CREATE POLICY "Categorías visibles públicamente por dealership" ON public.categories
  FOR SELECT USING (
    dealership_id IN (SELECT id FROM public.dealerships WHERE is_active = true)
  );

CREATE POLICY "Admin puede gestionar categorías de su dealership" ON public.categories
  FOR ALL USING (
    dealership_id IN (
      SELECT dealership_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Políticas para SUBCATEGORIES
CREATE POLICY "Subcategorías visibles públicamente" ON public.subcategories
  FOR SELECT USING (
    dealership_id IN (SELECT id FROM public.dealerships WHERE is_active = true)
  );

CREATE POLICY "Admin puede gestionar subcategorías de su dealership" ON public.subcategories
  FOR ALL USING (
    dealership_id IN (
      SELECT dealership_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Políticas para PRODUCTS
CREATE POLICY "Productos visibles públicamente" ON public.products
  FOR SELECT USING (
    dealership_id IN (SELECT id FROM public.dealerships WHERE is_active = true)
  );

CREATE POLICY "Admin puede gestionar productos de su dealership" ON public.products
  FOR ALL USING (
    dealership_id IN (
      SELECT dealership_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Políticas para PRODUCT_IMAGES
CREATE POLICY "Imágenes de productos visibles públicamente" ON public.product_images
  FOR SELECT USING (
    dealership_id IN (SELECT id FROM public.dealerships WHERE is_active = true)
  );

CREATE POLICY "Admin puede gestionar imágenes de su dealership" ON public.product_images
  FOR ALL USING (
    dealership_id IN (
      SELECT dealership_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Políticas para EMPLOYEES
CREATE POLICY "Empleados visibles públicamente" ON public.employees
  FOR SELECT USING (
    is_active = true AND
    dealership_id IN (SELECT id FROM public.dealerships WHERE is_active = true)
  );

CREATE POLICY "Admin puede gestionar empleados de su dealership" ON public.employees
  FOR ALL USING (
    dealership_id IN (
      SELECT dealership_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Políticas para SITE_SETTINGS
CREATE POLICY "Configuración del sitio visible públicamente" ON public.site_settings
  FOR SELECT USING (
    dealership_id IN (SELECT id FROM public.dealerships WHERE is_active = true)
  );

CREATE POLICY "Admin puede gestionar configuración de su dealership" ON public.site_settings
  FOR ALL USING (
    dealership_id IN (
      SELECT dealership_id FROM public.users WHERE id = auth.uid()
    )
  );

-- ============================================
-- DATOS INICIALES - DEALERSHIPS Y USERS
-- ============================================

-- Insertar los dos concesionarios
INSERT INTO public.dealerships (id, slug, name, email, phone, is_active) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'motostachira', 'Motos Táchira', 'motostachira@gmail.com', '+58 414 123 4567', true),
  ('d2222222-2222-2222-2222-222222222222', 'eklasvegas', 'Eklas Vegas', 'eklasvegas@gmail.com', '+58 414 765 4321', true)
ON CONFLICT (slug) DO NOTHING;

-- Vincular usuarios existentes con sus dealerships
INSERT INTO public.users (id, dealership_id, role, full_name) VALUES
  ('2d19cddb-afce-48c4-a073-9960078111d4', 'd1111111-1111-1111-1111-111111111111', 'admin', 'Admin Motos Táchira'),
  ('75481ae8-1e79-4ed7-bc61-e14000a5565c', 'd2222222-2222-2222-2222-222222222222', 'admin', 'Admin Eklas Vegas')
ON CONFLICT (id) DO NOTHING;

-- Inicializar site_settings para cada dealership
INSERT INTO public.site_settings (dealership_id, hero_title, hero_subtitle, footer_text) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Bienvenido a Motos Táchira', 'Tu concesionario de confianza', 'Motos Táchira © 2025. Todos los derechos reservados.'),
  ('d2222222-2222-2222-2222-222222222222', 'Bienvenido a Eklas Vegas', 'Las mejores motos de la ciudad', 'Eklas Vegas © 2025. Todos los derechos reservados.')
ON CONFLICT (dealership_id) DO NOTHING;

-- ============================================
-- STORAGE BUCKETS (Ejecutar desde Supabase UI o mediante SQL)
-- ============================================

-- Crear buckets de almacenamiento
-- NOTA: Los buckets se crean mejor desde la UI de Supabase Storage
-- Buckets necesarios:
-- 1. 'motorcycles' (público) - para imágenes de productos
-- 2. 'site-assets' (público) - para logos, banners, fotos empleados

-- Políticas de storage se configuran en la UI de Supabase Storage
-- Permitir lectura pública y escritura solo para usuarios autenticados del dealership correspondiente

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función para obtener el dealership_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_dealership_id()
RETURNS UUID AS $$
  SELECT dealership_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_dealerships_updated_at BEFORE UPDATE ON public.dealerships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON public.subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ¡ESQUEMA COMPLETO!
-- ============================================
-- Copia y pega este SQL completo en el SQL Editor de Supabase
-- Luego crea los buckets 'motorcycles' y 'site-assets' desde Storage UI
-- ============================================
