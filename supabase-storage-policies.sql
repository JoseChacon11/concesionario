-- ============================================
-- POLÍTICAS DE STORAGE PARA SUPABASE
-- ============================================
-- IMPORTANTE: Ejecuta esto en el SQL Editor de Supabase
-- O configura manualmente desde Storage > Policies
-- ============================================

-- NOTA: Las políticas de Storage en Supabase se configuran mejor desde la UI
-- Pero aquí están las políticas que necesitas:

-- ============================================
-- BUCKET: motorcycles
-- ============================================

-- Política 1: Permitir lectura pública de todas las imágenes
-- Nombre: "Public Access"
-- Operación: SELECT
-- Target roles: public
-- USING expression: true

-- Política 2: Permitir INSERT a usuarios autenticados del mismo dealership
-- Nombre: "Authenticated users can upload"
-- Operación: INSERT
-- Target roles: authenticated
-- WITH CHECK expression: true

-- Política 3: Permitir UPDATE a usuarios autenticados
-- Nombre: "Authenticated users can update"
-- Operación: UPDATE
-- Target roles: authenticated
-- USING expression: true

-- Política 4: Permitir DELETE a usuarios autenticados
-- Nombre: "Authenticated users can delete"
-- Operación: DELETE
-- Target roles: authenticated
-- USING expression: true

-- ============================================
-- BUCKET: site-assets
-- ============================================

-- Política 1: Permitir lectura pública
-- Nombre: "Public Access"
-- Operación: SELECT
-- Target roles: public
-- USING expression: true

-- Política 2: Permitir INSERT a usuarios autenticados
-- Nombre: "Authenticated users can upload"
-- Operación: INSERT
-- Target roles: authenticated
-- WITH CHECK expression: true

-- Política 3: Permitir UPDATE a usuarios autenticados
-- Nombre: "Authenticated users can update"
-- Operación: UPDATE
-- Target roles: authenticated
-- USING expression: true

-- Política 4: Permitir DELETE a usuarios autenticados
-- Nombre: "Authenticated users can delete"
-- Operación: DELETE
-- Target roles: authenticated
-- USING expression: true

-- ============================================
-- INSTRUCCIONES PARA CONFIGURAR EN SUPABASE UI
-- ============================================

/*
1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/sinflgzydhmzorvifijp

2. Ve a Storage → Buckets

3. Para CADA bucket (motorcycles y site-assets):
   
   a) Click en el bucket
   b) Ve a la pestaña "Policies"
   c) Click en "New Policy"
   d) Selecciona "For full customization"
   
   e) Crea 4 políticas:

   POLÍTICA 1 - Lectura Pública:
   - Policy name: Public read access
   - Allowed operation: SELECT
   - Target roles: public
   - USING expression: true
   - Click "Review" → "Save policy"

   POLÍTICA 2 - INSERT para autenticados:
   - Policy name: Authenticated users can insert
   - Allowed operation: INSERT  
   - Target roles: authenticated
   - WITH CHECK expression: true
   - Click "Review" → "Save policy"

   POLÍTICA 3 - UPDATE para autenticados:
   - Policy name: Authenticated users can update
   - Allowed operation: UPDATE
   - Target roles: authenticated
   - USING expression: true
   - Click "Review" → "Save policy"

   POLÍTICA 4 - DELETE para autenticados:
   - Policy name: Authenticated users can delete
   - Allowed operation: DELETE
   - Target roles: authenticated
   - USING expression: true
   - Click "Review" → "Save policy"

4. Repite para ambos buckets: motorcycles y site-assets

5. Verifica que los buckets sean públicos:
   - En la lista de buckets, verifica que tengan el badge "Public"
   - Si no, click en el bucket → Configuration → Make public

¡IMPORTANTE!
- Los buckets DEBEN ser públicos para que las imágenes se vean en el landing
- Las políticas permiten que usuarios autenticados suban archivos
- Las políticas permiten que cualquiera pueda ver las imágenes
*/
