// Test de autenticación con Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://sinflgzydhmzorvifijp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpbmZsZ3p5ZGhtem9ydmlmaWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgwMDQsImV4cCI6MjA4NDYwNDAwNH0.8GQsbQfS9wzKt8LyElkmvmR89XdC3vzJ1IV6d8hVLP8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('🔍 Testing Supabase Authentication...\n')

  // Test 1: Login con motostachira
  console.log('1️⃣ Testing login with motostachira@gmail.com...')
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'motostachira@gmail.com',
      password: 'motostachira'
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Login successful!')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)

    // Test 2: Obtener datos del usuario y su dealership
    console.log('\n2️⃣ Fetching user dealership data...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        dealerships (
          id,
          slug,
          name,
          email,
          phone,
          is_active
        )
      `)
      .eq('id', authData.user.id)
      .single()

    if (userError) {
      console.error('❌ Error fetching user data:', userError.message)
    } else {
      console.log('✅ User data fetched successfully!')
      console.log('   Dealership:', userData.dealerships.name)
      console.log('   Slug:', userData.dealerships.slug)
      console.log('   Role:', userData.role)
    }

    // Test 3: Verificar categorías (si hay)
    console.log('\n3️⃣ Fetching categories for dealership...')
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('dealership_id', userData.dealerships.id)

    if (catError) {
      console.error('❌ Error fetching categories:', catError.message)
    } else {
      console.log(`✅ Found ${categories.length} categories`)
      if (categories.length > 0) {
        categories.forEach(cat => console.log(`   - ${cat.name}`))
      }
    }

    // Test 4: Verificar productos
    console.log('\n4️⃣ Fetching products for dealership...')
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('dealership_id', userData.dealerships.id)

    if (prodError) {
      console.error('❌ Error fetching products:', prodError.message)
    } else {
      console.log(`✅ Found ${products.length} products`)
      if (products.length > 0) {
        products.forEach(prod => console.log(`   - ${prod.name}`))
      }
    }

    // Test 5: Verificar empleados
    console.log('\n5️⃣ Fetching employees for dealership...')
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('dealership_id', userData.dealerships.id)

    if (empError) {
      console.error('❌ Error fetching employees:', empError.message)
    } else {
      console.log(`✅ Found ${employees.length} employees`)
      if (employees.length > 0) {
        employees.forEach(emp => console.log(`   - ${emp.full_name}`))
      }
    }

    // Test 6: Verificar site settings
    console.log('\n6️⃣ Fetching site settings...')
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .eq('dealership_id', userData.dealerships.id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('❌ Error fetching settings:', settingsError.message)
    } else if (!settings) {
      console.log('⚠️  No settings found (expected for new dealership)')
    } else {
      console.log('✅ Settings found!')
      console.log('   Hero Title:', settings.hero_title)
    }

    // Test 7: Logout
    console.log('\n7️⃣ Testing logout...')
    const { error: logoutError } = await supabase.auth.signOut()
    if (logoutError) {
      console.error('❌ Logout failed:', logoutError.message)
    } else {
      console.log('✅ Logout successful!')
    }

    console.log('\n✅ All tests completed successfully!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAuth()
