'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Search, MessageCircle, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, Package, Music, FilterX } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useCartStore } from '@/store/cart-store'
import { CartDrawer } from '@/components/cart-drawer'
import { ModeToggle } from '@/components/mode-toggle'
import { ProductGridSkeleton } from '@/components/skeletons/product-skeleton'
import { MotorcycleSpecsBadge } from '@/components/products/MotorcycleTechnicalSheet'
import Fuse from 'fuse.js'

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
  const supabase = createClient()
  const { toast } = useToast()
  const { addItem, setDealershipInfo } = useCartStore()

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
      
      // Set dealership info in cart store
      setDealershipInfo({
        name: dealershipData.name,
        main_whatsapp: settingsData?.main_whatsapp || dealershipData.phone,
        phone: dealershipData.phone,
      })

      // Fetch products with images
      const { data: productsData } = await supabase
        .from('products')
        .select(`*,
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
        .select(`*,
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

  const handleAddToCart = (product) => {
    addItem(product)
    toast({
      title: 'Agregado al carrito',
      description: `${product.name} agregado correctamente`,
    })
  }

  // Fuzzy search configuration
  const fuse = useMemo(() => {
    if (!products.length) return null
    
    return new Fuse(products, {
      keys: ['name', 'brand', 'model', 'description'],
      threshold: 0.4,
      includeScore: true,
    })
  }, [products])

  // Filtered products with fuzzy search
  const filteredProducts = useMemo(() => {
    let result = products

    // Apply fuzzy search
    if (searchTerm && fuse) {
      const searchResults = fuse.search(searchTerm)
      result = searchResults.map(({ item }) => item)
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter((product) => product.category_id === selectedCategory)
    }

    // Apply subcategory filter
    if (selectedSubcategory) {
      result = result.filter((product) => product.subcategory_id === selectedSubcategory)
    }

    return result
  }, [products, searchTerm, selectedCategory, selectedSubcategory, fuse])

  // Get filtered subcategories based on selected category
  const filteredSubcategories = useMemo(() => {
    if (!selectedCategory) return []
    const category = categories.find((cat) => cat.id === selectedCategory)
    return category?.subcategories || []
  }, [selectedCategory, categories])

  const getPrimaryImage = (product) => {
    return product.product_images?.find((img) => img.is_primary) || product.product_images?.[0]
  }

  const isMotorcycle = (product) => {
    return product.categories?.name?.toLowerCase().includes('moto')
  }

  // Check if there are active filters
  const hasActiveFilters = searchTerm || selectedCategory || selectedSubcategory

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedSubcategory('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!dealership) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <h1 className="text-4xl font-bold mb-4">Concesionario no encontrado</h1>
        <p className="text-muted-foreground">El concesionario que buscas no existe o está inactivo</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-2 md:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {settings?.logo_url ? (
              <Image
                src={settings.logo_url || "/placeholder.svg"}
                alt={dealership.name}
                width={150}
                height={60}
                className="object-contain"
              />
            ) : (
              <h1 className="text-2xl font-bold text-primary">
                {dealership.name}
              </h1>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <ModeToggle />
            <CartDrawer />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {settings?.hero_image_url && (
        <section className="relative h-96 overflow-hidden">
          <Image
            src={settings.hero_image_url || "/placeholder.svg"}
            alt="Hero"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 flex items-center justify-center">
            <div className="text-center text-white space-y-4 px-4 max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-bold text-balance">
                {settings.hero_title || dealership.name}
              </h1>
              <p className="text-lg md:text-xl text-gray-100">
                {settings.hero_subtitle || 'Tu concesionario de confianza'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Search and Filters Section */}
      <section className="border-b py-4 bg-gradient-to-r from-background to-card/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-3">
            {/* Main Filters Row */}
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 items-stretch lg:items-center">
              {/* Search Bar */}
              <div className="flex-1 min-w-0 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                <Input
                  placeholder="Buscar marca, modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              {/* Category Filter */}
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground hover:border-primary/50 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background flex-shrink-0 min-w-fit"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSelectedSubcategory('')
                }}
              >
                <option value="">Categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Subcategory Filter */}
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground hover:border-primary/50 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background disabled:opacity-50 flex-shrink-0 min-w-fit"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">Subcategoría</option>
                {filteredSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              {/* Clear Button */}
              {hasActiveFilters && (
                <Button
                  onClick={clearAllFilters}
                  size="default"
                  className="gap-2 whitespace-nowrap h-10 flex-shrink-0"
                >
                  <FilterX className="w-4 h-4" />
                  <span className="text-sm font-medium">Limpiar Filtros</span>
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1 cursor-pointer text-xs">
                    Búsqueda: {searchTerm}
                    <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1 cursor-pointer text-xs">
                    {categories.find(c => c.id === selectedCategory)?.name}
                    <button onClick={() => { setSelectedCategory(''); setSelectedSubcategory(''); }} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                )}
                {selectedSubcategory && (
                  <Badge variant="secondary" className="gap-1 cursor-pointer text-xs">
                    {filteredSubcategories.find(s => s.id === selectedSubcategory)?.name}
                    <button onClick={() => setSelectedSubcategory('')} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products Catalog */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Catálogo de Productos</h2>
            <p className="text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No se encontraron productos</p>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta ajustar los filtros o la búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const primaryImage = getPrimaryImage(product)
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] group">
                    <Link href={`/catalogo/${slug}/producto/${product.id}`}>
                      <div className="relative aspect-square bg-muted animate-fadeIn">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.image_url || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="w-16 h-16 text-muted-foreground/20" />
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
                    </Link>
                    
                    <CardContent className="p-4">
                      <Link href={`/catalogo/${slug}/producto/${product.id}`}>
                        <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>
                      
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
                        <p className="text-2xl font-bold text-primary mb-3">
                          ${product.price.toLocaleString()}
                        </p>
                      )}
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      {/* Motorcycle Specs Badges */}
                      {isMotorcycle(product) && (
                        <MotorcycleSpecsBadge specifications={product.specifications} />
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1"
                          disabled={product.status !== 'available'}
                          size="sm"
                        >
                          Agregar
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                        >
                          <Link href={`/catalogo/${slug}/producto/${product.id}`}>
                            Ver
                          </Link>
                        </Button>
                      </div>
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
        <section className="py-12 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Nuestro Equipo</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {employees.map((employee) => (
                <Card key={employee.id} className="overflow-hidden">
                  <CardContent className="p-4 text-center space-y-3">
                    {employee.photo_url ? (
                      <Image
                        src={employee.photo_url || "/placeholder.svg"}
                        alt={employee.full_name}
                        width={100}
                        height={100}
                        className="rounded-full object-cover mx-auto w-24 h-24"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                        {employee.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-1">{employee.full_name}</h3>
                      {employee.position && (
                        <p className="text-xs text-muted-foreground">{employee.position}</p>
                      )}
                    </div>
                    {employee.whatsapp && (
                      <Button
                        onClick={() => window.open(`https://wa.me/${employee.whatsapp.replace(/[^0-9]/g, '')}`, '_blank')}
                        className="w-full bg-[#25D366] hover:bg-[#20BA5A] h-8 text-xs"
                        size="sm"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
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
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-3">{dealership.name}</h3>
              <p className="text-sm text-muted-foreground">
                {settings?.footer_text || `Tu concesionario de confianza`}
              </p>
            </div>
            {(settings?.footer_address || settings?.footer_phone || settings?.footer_email) && (
              <div>
                <h3 className="text-lg font-bold mb-3">Contacto</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {settings?.footer_address && (
                    <p className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                      {settings.footer_address}
                    </p>
                  )}
                  {settings?.footer_phone && (
                    <p className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 shrink-0" />
                      {settings.footer_phone}
                    </p>
                  )}
                  {settings?.footer_email && (
                    <p className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 shrink-0" />
                      {settings.footer_email}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold mb-3">Síguenos</h3>
              <div className="flex gap-3">
                {settings?.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {settings?.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {settings?.twitter_url && (
                  <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {settings?.youtube_url && (
                  <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {settings?.tiktok_url && (
                  <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <Music className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {dealership.name}. Todos los derechos reservados.</p>
          </div>

          {/* Advertising Section */}
          <div className="border-t border-zinc-800 mt-6 pt-6 text-center">
            <p className="text-xs text-zinc-500 hover:text-orange-500 transition-colors duration-200">
              ¿Quieres una página web profesional para tu concesionario, negocio o emprendimiento?{' '}
              <a
                href="https://wa.me/584247708616?text=Hola%2C%20vi%20tu%20publicidad%20en%20una%20de%20tus%20webs%20y%20quiero%20informaci%C3%B3n%20sobre%20una%20p%C3%A1gina%20para%20mi%20negocio"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-orange-400"
              >
                Contáctanos al +584247708616
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      {settings?.main_whatsapp && (
        <Button
          onClick={() => window.open(`https://wa.me/${settings.main_whatsapp.replace(/[^0-9]/g, '')}`, '_blank')}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-2xl bg-[#25D366] hover:bg-[#20BA5A]"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  )
}
