'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Search, ShoppingCart, MessageCircle, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, Package } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function CatalogoPage() {
  const params = useParams()
  const slug = params.slug
  const [dealership, setDealership] = useState(null)
  const [settings, setSettings] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [cart, setCart] = useState([])
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    if (slug) {
      fetchDealershipData()
    }
  }, [slug])

  const fetchDealershipData = async () => {
    try {
      // Fetch dealership
      const { data: dealershipData, error: dealershipError } = await supabase
        .from('dealerships')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (dealershipError) throw dealershipError
      setDealership(dealershipData)

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('dealership_id', dealershipData.id)
        .single()

      setSettings(settingsData)

      // Fetch products with images
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name, slug),
          subcategories (id, name, slug),
          product_images (id, image_url, is_primary, display_order)
        `)
        .eq('dealership_id', dealershipData.id)
        .order('created_at', { ascending: false })

      setProducts(productsData || [])

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories (*)
        `)
        .eq('dealership_id', dealershipData.id)
        .order('name')

      setCategories(categoriesData || [])

      // Fetch employees
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('dealership_id', dealershipData.id)
        .eq('is_active', true)
        .order('display_order')

      setEmployees(employeesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el concesionario',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id)
      if (existing) {
        return prev.map((p) => 
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    toast({
      title: 'Agregado al carrito',
      description: `${product.name} agregado`,
    })
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((p) => p.id !== productId))
  }

  const sendWhatsAppInquiry = () => {
    if (cart.length === 0) {
      toast({
        title: 'Carrito vacío',
        description: 'Agrega productos para consultar',
        variant: 'destructive',
      })
      return
    }

    const message = `Hola! Estoy interesado en los siguientes productos:\n\n${cart
      .map((item) => `• ${item.name} (${item.quantity}x)${item.price ? ` - $${item.price}` : ''}`)
      .join('\n')}\n\n¿Podrían darme más información?`

    const phone = settings?.main_whatsapp || dealership?.phone || ''
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const filteredProducts = products.filter((product) => {
    if (selectedCategory && product.category_id !== selectedCategory) return false
    if (selectedSubcategory && product.subcategory_id !== selectedSubcategory) return false
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (priceRange.min && product.price < parseFloat(priceRange.min)) return false
    if (priceRange.max && product.price > parseFloat(priceRange.max)) return false
    return true
  })

  const getPrimaryImage = (product) => {
    return product.product_images?.find((img) => img.is_primary) || product.product_images?.[0]
  }

  const isMotorcycle = (product) => {
    return product.categories?.name?.toLowerCase().includes('moto')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!dealership) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-4">Concesionario no encontrado</h1>
        <p className="text-muted-foreground">El concesionario que buscas no existe o está inactivo</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {settings?.logo_url ? (
              <Image
                src={settings.logo_url}
                alt={dealership.name}
                width={150}
                height={60}
                className="object-contain"
              />
            ) : (
              <h1 className="text-2xl font-bold" style={{ color: settings?.primary_color || '#000' }}>
                {dealership.name}
              </h1>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {cart.length > 0 && (
              <Button onClick={sendWhatsAppInquiry} className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Consultar ({cart.length})
                <Badge className="absolute -top-2 -right-2" variant="destructive">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {settings?.hero_image_url && (
        <section className="relative h-96 overflow-hidden">
          <Image
            src={settings.hero_image_url}
            alt="Hero"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white space-y-4 px-4">
              <h1 className="text-5xl font-bold">{settings.hero_title || dealership.name}</h1>
              <p className="text-xl">{settings.hero_subtitle || 'Tu concesionario de confianza'}</p>
            </div>
          </div>
        </section>
      )}

      {/* Filters Section */}
      <section className="border-b bg-slate-50 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSelectedSubcategory('')
              }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
            >
              <option value="">Todas las subcategorías</option>
              {categories
                .find((cat) => cat.id === selectedCategory)
                ?.subcategories?.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
            </select>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Precio mín."
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Precio máx."
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Catalog */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Catálogo de Productos</h2>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const primaryImage = getPrimaryImage(product)
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48 bg-slate-100">
                      {primaryImage ? (
                        <Image
                          src={primaryImage.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-16 h-16 text-slate-300" />
                        </div>
                      )}
                      <Badge
                        className="absolute top-2 right-2"
                        variant={
                          product.status === 'available'
                            ? 'default'
                            : product.status === 'sold'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {product.status === 'available'
                          ? 'Disponible'
                          : product.status === 'sold'
                          ? 'Vendido'
                          : 'Reservado'}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                      {isMotorcycle(product) && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {product.brand} {product.model} {product.year}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.categories?.name}
                        {product.subcategories && ` • ${product.subcategories.name}`}
                      </p>
                      {product.price && (
                        <p className="text-2xl font-bold mb-3" style={{ color: settings?.primary_color || '#000' }}>
                          ${product.price.toLocaleString()}
                        </p>
                      )}
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <Button
                        onClick={() => addToCart(product)}
                        className="w-full"
                        disabled={product.status !== 'available'}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Agregar al Carrito
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Employees Section */}
      {employees.length > 0 && (
        <section className="py-12 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Nuestro Equipo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {employees.map((employee) => (
                <Card key={employee.id}>
                  <CardContent className="pt-6 text-center">
                    {employee.photo_url ? (
                      <Image
                        src={employee.photo_url}
                        alt={employee.full_name}
                        width={120}
                        height={120}
                        className="rounded-full object-cover mx-auto mb-4 w-30 h-30"
                      />
                    ) : (
                      <div className="w-30 h-30 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                        {employee.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <h3 className="font-semibold text-lg">{employee.full_name}</h3>
                    {employee.position && (
                      <p className="text-sm text-muted-foreground mb-4">{employee.position}</p>
                    )}
                    {employee.whatsapp && (
                      <Button
                        onClick={() => window.open(`https://wa.me/${employee.whatsapp.replace(/[^0-9]/g, '')}`, '_blank')}
                        className="w-full"
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contactar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{dealership.name}</h3>
              <p className="text-slate-300">
                {settings?.footer_text || `Tu concesionario de confianza`}
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contacto</h3>
              <div className="space-y-2 text-slate-300">
                {settings?.footer_address && (
                  <p className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {settings.footer_address}
                  </p>
                )}
                {settings?.footer_phone && (
                  <p className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {settings.footer_phone}
                  </p>
                )}
                {settings?.footer_email && (
                  <p className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {settings.footer_email}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Síguenos</h3>
              <div className="flex space-x-4">
                {settings?.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                    <Facebook className="w-6 h-6" />
                  </a>
                )}
                {settings?.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-pink-400">
                    <Instagram className="w-6 h-6" />
                  </a>
                )}
                {settings?.twitter_url && (
                  <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                    <Twitter className="w-6 h-6" />
                  </a>
                )}
                {settings?.youtube_url && (
                  <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-red-400">
                    <Youtube className="w-6 h-6" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>© {new Date().getFullYear()} {dealership.name}. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      {settings?.main_whatsapp && (
        <Button
          onClick={() => window.open(`https://wa.me/${settings.main_whatsapp.replace(/[^0-9]/g, '')}`, '_blank')}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-2xl"
          style={{ backgroundColor: '#25D366' }}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  )
}
