-- ============================================
-- AUTOMATIZACIÓN DE CATEGORÍAS AL CREAR DEALERSHIP
-- ============================================

-- Función para crear categorías y subcategorías por defecto
CREATE OR REPLACE FUNCTION create_default_categories_for_dealership()
RETURNS TRIGGER AS $$
DECLARE
  motos_category_id UUID;
  accesorios_category_id UUID;
  repuestos_category_id UUID;
BEGIN
  -- Crear categoría "Motos"
  INSERT INTO public.categories (dealership_id, name, slug, description)
  VALUES (
    NEW.id,
    'Motos',
    'motos',
    'Motocicletas y vehículos de dos ruedas'
  )
  RETURNING id INTO motos_category_id;

  -- Crear subcategorías de Motos
  INSERT INTO public.subcategories (dealership_id, category_id, name, slug, description)
  VALUES
    (NEW.id, motos_category_id, 'Clásicas', 'clasicas', 'Motocicletas clásicas y vintage'),
    (NEW.id, motos_category_id, 'Scooters', 'scooters', 'Scooters urbanos y de ciudad'),
    (NEW.id, motos_category_id, 'Doble Propósito', 'doble-proposito', 'Motos versátiles para ciudad y campo'),
    (NEW.id, motos_category_id, 'Deportivas', 'deportivas', 'Motocicletas deportivas y de alto rendimiento'),
    (NEW.id, motos_category_id, 'ATV-UTV', 'atv-utv', 'Vehículos todo terreno'),
    (NEW.id, motos_category_id, 'Eléctricas', 'electricas', 'Motocicletas eléctricas');

  -- Crear categoría "Accesorios"
  INSERT INTO public.categories (dealership_id, name, slug, description)
  VALUES (
    NEW.id,
    'Accesorios',
    'accesorios',
    'Accesorios y equipamiento para motociclistas'
  )
  RETURNING id INTO accesorios_category_id;

  -- Crear subcategorías de Accesorios
  INSERT INTO public.subcategories (dealership_id, category_id, name, slug, description)
  VALUES
    (NEW.id, accesorios_category_id, 'Cascos', 'cascos', 'Cascos de protección'),
    (NEW.id, accesorios_category_id, 'Guantes', 'guantes', 'Guantes para motociclismo'),
    (NEW.id, accesorios_category_id, 'Chaquetas', 'chaquetas', 'Chaquetas y ropa protectora'),
    (NEW.id, accesorios_category_id, 'Maletas', 'maletas', 'Maletas y bolsos para moto');

  -- Crear categoría "Repuestos"
  INSERT INTO public.categories (dealership_id, name, slug, description)
  VALUES (
    NEW.id,
    'Repuestos',
    'repuestos',
    'Repuestos y partes para motocicletas'
  )
  RETURNING id INTO repuestos_category_id;

  -- Crear subcategorías de Repuestos
  INSERT INTO public.subcategories (dealership_id, category_id, name, slug, description)
  VALUES
    (NEW.id, repuestos_category_id, 'Motor', 'motor', 'Repuestos de motor'),
    (NEW.id, repuestos_category_id, 'Frenos', 'frenos', 'Sistema de frenos'),
    (NEW.id, repuestos_category_id, 'Suspensión', 'suspension', 'Sistema de suspensión'),
    (NEW.id, repuestos_category_id, 'Eléctrico', 'electrico', 'Sistema eléctrico');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta al insertar un nuevo dealership
DROP TRIGGER IF EXISTS trigger_create_default_categories ON public.dealerships;

CREATE TRIGGER trigger_create_default_categories
  AFTER INSERT ON public.dealerships
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories_for_dealership();

-- ============================================
-- ACTUALIZACIÓN DE TABLA PRODUCTS PARA ESPECIFICACIONES
-- ============================================

-- El campo specifications ya existe como JSONB, pero vamos a asegurar su estructura
-- Comentario sobre la estructura esperada del JSONB:

/*
Estructura del campo specifications para MOTOS:

{
  "motor": {
    "motor": "Monocilíndrico, 4 tiempos",
    "potencia_maxima": "15.4 HP @ 8500 rpm",
    "torque_maximo": "13.8 Nm @ 7000 rpm",
    "diametro_carrera": "57.3 x 57.8 mm",
    "relacion_compresion": "10.0:1",
    "sistema_combustible": "Inyección electrónica",
    "enfriamiento": "Refrigerado por aire"
  },
  "transmision": {
    "tipo": "Manual",
    "embrague": "Húmedo multidisco",
    "transmision": "5 velocidades",
    "unidad_final": "Cadena"
  },
  "chasis": {
    "suspension_delantera": "Telescópica hidráulica",
    "suspension_trasera": "Basculante con amortiguador",
    "frenos_delantero": "Disco 240mm",
    "frenos_trasero": "Tambor 110mm",
    "cauchos_delantero": "2.75-18",
    "cauchos_trasero": "3.00-17",
    "capacidad_combustible": "12 litros",
    "color": "Negro, Rojo, Azul"
  },
  "electrico": {
    "encendido": "CDI",
    "bujias": "NGK CR7E",
    "faro": "LED",
    "luz_freno": "LED",
    "luces_cruce": "Halógeno"
  },
  "dimension": {
    "tamano_caja": "N/A",
    "longitud": "2045 mm",
    "ancho": "765 mm",
    "altura": "1090 mm",
    "distancia_ejes": "1285 mm",
    "capacidad_carga": "150 kg",
    "peso": "135 kg"
  },
  "garantia": {
    "tiempo": "1 año o 10,000 km"
  }
}
*/

-- Índice para búsquedas en specifications
CREATE INDEX IF NOT EXISTS idx_products_specifications ON public.products USING gin (specifications);

-- ============================================
-- FUNCIÓN AUXILIAR PARA OBTENER ESPECIFICACIÓN
-- ============================================

CREATE OR REPLACE FUNCTION get_specification(specs JSONB, path TEXT[])
RETURNS TEXT AS $$
BEGIN
  RETURN specs #>> path;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- APLICAR A DEALERSHIPS EXISTENTES (OPCIONAL)
-- ============================================

-- Si quieres aplicar las categorías a los dealerships existentes que no las tienen:
/*
DO $$
DECLARE
  dealer RECORD;
BEGIN
  FOR dealer IN SELECT id FROM public.dealerships WHERE id NOT IN (
    SELECT DISTINCT dealership_id FROM public.categories
  ) LOOP
    PERFORM create_default_categories_for_dealership_manual(dealer.id);
  END LOOP;
END $$;
*/

-- Función manual para crear categorías (útil para dealerships existentes)
CREATE OR REPLACE FUNCTION create_default_categories_for_dealership_manual(p_dealership_id UUID)
RETURNS VOID AS $$
DECLARE
  motos_category_id UUID;
  accesorios_category_id UUID;
  repuestos_category_id UUID;
BEGIN
  -- Crear categoría "Motos"
  INSERT INTO public.categories (dealership_id, name, slug, description)
  VALUES (
    p_dealership_id,
    'Motos',
    'motos',
    'Motocicletas y vehículos de dos ruedas'
  )
  RETURNING id INTO motos_category_id;

  -- Crear subcategorías de Motos
  INSERT INTO public.subcategories (dealership_id, category_id, name, slug, description)
  VALUES
    (p_dealership_id, motos_category_id, 'Clásicas', 'clasicas', 'Motocicletas clásicas y vintage'),
    (p_dealership_id, motos_category_id, 'Scooters', 'scooters', 'Scooters urbanos y de ciudad'),
    (p_dealership_id, motos_category_id, 'Doble Propósito', 'doble-proposito', 'Motos versátiles para ciudad y campo'),
    (p_dealership_id, motos_category_id, 'Deportivas', 'deportivas', 'Motocicletas deportivas y de alto rendimiento'),
    (p_dealership_id, motos_category_id, 'ATV-UTV', 'atv-utv', 'Vehículos todo terreno'),
    (p_dealership_id, motos_category_id, 'Eléctricas', 'electricas', 'Motocicletas eléctricas');

  -- Crear categoría "Accesorios"
  INSERT INTO public.categories (dealership_id, name, slug, description)
  VALUES (
    p_dealership_id,
    'Accesorios',
    'accesorios',
    'Accesorios y equipamiento para motociclistas'
  )
  RETURNING id INTO accesorios_category_id;

  -- Crear subcategorías de Accesorios
  INSERT INTO public.subcategories (dealership_id, category_id, name, slug, description)
  VALUES
    (p_dealership_id, accesorios_category_id, 'Cascos', 'cascos', 'Cascos de protección'),
    (p_dealership_id, accesorios_category_id, 'Guantes', 'guantes', 'Guantes para motociclismo'),
    (p_dealership_id, accesorios_category_id, 'Chaquetas', 'chaquetas', 'Chaquetas y ropa protectora'),
    (p_dealership_id, accesorios_category_id, 'Maletas', 'maletas', 'Maletas y bolsos para moto');

  -- Crear categoría "Repuestos"
  INSERT INTO public.categories (dealership_id, name, slug, description)
  VALUES (
    p_dealership_id,
    'Repuestos',
    'repuestos',
    'Repuestos y partes para motocicletas'
  )
  RETURNING id INTO repuestos_category_id;

  -- Crear subcategorías de Repuestos
  INSERT INTO public.subcategories (dealership_id, category_id, name, slug, description)
  VALUES
    (p_dealership_id, repuestos_category_id, 'Motor', 'motor', 'Repuestos de motor'),
    (p_dealership_id, repuestos_category_id, 'Frenos', 'frenos', 'Sistema de frenos'),
    (p_dealership_id, repuestos_category_id, 'Suspensión', 'suspension', 'Sistema de suspensión'),
    (p_dealership_id, repuestos_category_id, 'Eléctrico', 'electrico', 'Sistema eléctrico');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EJECUTAR PARA DEALERSHIPS EXISTENTES
-- ============================================

-- Aplicar a Motos Táchira
SELECT create_default_categories_for_dealership_manual('d1111111-1111-1111-1111-111111111111');

-- Aplicar a Eklas Vegas
SELECT create_default_categories_for_dealership_manual('d2222222-2222-2222-2222-222222222222');

-- ============================================
-- ¡LISTO! Ahora cada nuevo dealership tendrá categorías automáticas
-- ============================================
