# 🔧 GUÍA: Configurar Storage Policies en Supabase

## ⚠️ PROBLEMA ACTUAL
Las imágenes no se están subiendo porque **faltan las políticas de Storage** en Supabase.

## ✅ SOLUCIÓN (5 minutos)

### Paso 1: Acceder a Storage
1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/sinflgzydhmzorvifijp
2. En el menú lateral izquierdo, click en **Storage**
3. Verás tus 2 buckets: `motorcycles` y `site-assets`

### Paso 2: Verificar que los buckets sean públicos

Para CADA bucket (motorcycles y site-assets):

1. Click en el bucket
2. Click en **Configuration** (arriba a la derecha)
3. Verifica que diga **"Public bucket"**
4. Si NO es público, activa el toggle **"Public bucket"** y guarda

### Paso 3: Crear Políticas de Storage

Para CADA bucket (motorcycles y site-assets), debes crear 4 políticas:

#### 3.1. Click en el bucket
#### 3.2. Click en la pestaña **"Policies"**
#### 3.3. Click en **"New Policy"**
#### 3.4. Click en **"For full customization"**

---

### 📝 POLÍTICA 1: Lectura Pública (SELECT)

```
Policy name: Public read access
Allowed operation: ✅ SELECT
Policy definition:
  - Target roles: public
  - USING expression: true
```

**Copiar y pegar en USING:**
```sql
true
```

Click **"Review"** → **"Save policy"**

---

### 📝 POLÍTICA 2: INSERT para Autenticados

```
Policy name: Authenticated users can insert
Allowed operation: ✅ INSERT
Policy definition:
  - Target roles: authenticated
  - WITH CHECK expression: true
```

**Copiar y pegar en WITH CHECK:**
```sql
true
```

Click **"Review"** → **"Save policy"**

---

### 📝 POLÍTICA 3: UPDATE para Autenticados

```
Policy name: Authenticated users can update
Allowed operation: ✅ UPDATE
Policy definition:
  - Target roles: authenticated
  - USING expression: true
```

**Copiar y pegar en USING:**
```sql
true
```

Click **"Review"** → **"Save policy"**

---

### 📝 POLÍTICA 4: DELETE para Autenticados

```
Policy name: Authenticated users can delete
Allowed operation: ✅ DELETE
Policy definition:
  - Target roles: authenticated
  - USING expression: true
```

**Copiar y pegar en USING:**
```sql
true
```

Click **"Review"** → **"Save policy"**

---

## ✅ VERIFICACIÓN

Después de crear las 4 políticas para AMBOS buckets, deberías ver:

### Bucket: motorcycles
- ✅ 4 políticas creadas
- ✅ Bucket es público

### Bucket: site-assets  
- ✅ 4 políticas creadas
- ✅ Bucket es público

## 🧪 PROBAR

1. Haz login en el dashboard: `/login`
2. Ve a **Productos** → **Nuevo Producto**
3. Selecciona una categoría
4. Llena los datos del producto
5. Click en **"Subir Imágenes"** y selecciona archivos
6. Click en **"Crear"**

**Resultado esperado:** Las imágenes se subirán correctamente y verás la URL en la base de datos.

## 🔍 TROUBLESHOOTING

### Si aún no funciona:

1. **Verifica en Console del navegador** (F12):
   - ¿Hay errores de CORS?
   - ¿Hay errores de permisos (403)?

2. **Verifica las políticas**:
   - Ve a Storage → Bucket → Policies
   - Deberías ver las 4 políticas activas (verde)

3. **Verifica que el bucket sea público**:
   - Storage → Buckets
   - Debe tener badge "Public"

4. **Prueba subir manualmente**:
   - Storage → Bucket → Click "Upload file"
   - Si puedes subir, las políticas funcionan

## 📋 RESUMEN RÁPIDO

**Para motorcycles:**
1. ✅ Bucket público
2. ✅ Política SELECT (public)
3. ✅ Política INSERT (authenticated)
4. ✅ Política UPDATE (authenticated)
5. ✅ Política DELETE (authenticated)

**Para site-assets:**
1. ✅ Bucket público
2. ✅ Política SELECT (public)
3. ✅ Política INSERT (authenticated)
4. ✅ Política UPDATE (authenticated)
5. ✅ Política DELETE (authenticated)

---

## 🎯 ¿POR QUÉ ES NECESARIO?

- **SELECT público**: Para que las imágenes se vean en el landing page sin autenticación
- **INSERT/UPDATE/DELETE autenticados**: Para que los admins del concesionario puedan gestionar sus imágenes
- **Bucket público**: Para que las URLs de las imágenes funcionen directamente

---

**Una vez configurado, las imágenes se subirán automáticamente y aparecerán en el catálogo.** 🚀
