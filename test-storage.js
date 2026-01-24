// Test de subida de imágenes a Supabase Storage
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://sinflgzydhmzorvifijp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpbmZsZ3p5ZGhtem9ydmlmaWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgwMDQsImV4cCI6MjA4NDYwNDAwNH0.8GQsbQfS9wzKt8LyElkmvmR89XdC3vzJ1IV6d8hVLP8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStorage() {
  console.log('🧪 Testing Supabase Storage...\n')

  // Test 1: Login primero
  console.log('1️⃣ Logging in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'motostachira@gmail.com',
    password: 'motostachira'
  })

  if (authError) {
    console.error('❌ Login failed:', authError.message)
    console.log('\n⚠️  Debes hacer login antes de poder subir archivos')
    return
  }

  console.log('✅ Login successful!\n')

  // Test 2: Crear un archivo de prueba
  console.log('2️⃣ Creating test file...')
  const testContent = 'Test image content'
  const testFileName = 'test-image.txt'
  const testFilePath = path.join('/tmp', testFileName)
  
  fs.writeFileSync(testFilePath, testContent)
  console.log('✅ Test file created\n')

  // Test 3: Subir a motorcycles bucket
  console.log('3️⃣ Uploading to motorcycles bucket...')
  const fileName = `test/${Date.now()}-test.txt`
  
  const fileBuffer = fs.readFileSync(testFilePath)
  
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('motorcycles')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message)
      console.log('\n⚠️  ERROR COMÚN: Si ves "new row violates row-level security policy"')
      console.log('     Significa que las políticas de Storage NO están configuradas.')
      console.log('     Lee el archivo: CONFIGURAR_STORAGE.md\n')
      return
    }

    console.log('✅ Upload successful!')
    console.log('   Path:', uploadData.path)

    // Test 4: Obtener URL pública
    console.log('\n4️⃣ Getting public URL...')
    const { data: { publicUrl } } = supabase.storage
      .from('motorcycles')
      .getPublicUrl(fileName)

    console.log('✅ Public URL generated!')
    console.log('   URL:', publicUrl)

    // Test 5: Verificar que el archivo existe
    console.log('\n5️⃣ Verifying file exists...')
    const { data: files, error: listError } = await supabase.storage
      .from('motorcycles')
      .list('test', {
        limit: 100,
        offset: 0,
      })

    if (listError) {
      console.error('❌ List failed:', listError.message)
    } else {
      console.log('✅ File list retrieved!')
      console.log(`   Found ${files.length} files in test/ folder`)
    }

    // Test 6: Eliminar archivo de prueba
    console.log('\n6️⃣ Cleaning up test file...')
    const { error: deleteError } = await supabase.storage
      .from('motorcycles')
      .remove([fileName])

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError.message)
    } else {
      console.log('✅ Test file deleted!')
    }

    // Test 7: Probar site-assets bucket
    console.log('\n7️⃣ Testing site-assets bucket...')
    const fileName2 = `test/${Date.now()}-test2.txt`
    
    const { data: uploadData2, error: uploadError2 } = await supabase.storage
      .from('site-assets')
      .upload(fileName2, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError2) {
      console.error('❌ Upload to site-assets failed:', uploadError2.message)
    } else {
      console.log('✅ Upload to site-assets successful!')
      
      // Limpiar
      await supabase.storage.from('site-assets').remove([fileName2])
      console.log('✅ Cleanup complete!')
    }

    console.log('\n✅ ALL STORAGE TESTS PASSED!')
    console.log('\n🎉 Storage está configurado correctamente!')
    console.log('   Ahora puedes subir imágenes desde el dashboard.\n')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  } finally {
    // Limpiar archivo temporal
    fs.unlinkSync(testFilePath)
    
    // Logout
    await supabase.auth.signOut()
  }
}

testStorage()
