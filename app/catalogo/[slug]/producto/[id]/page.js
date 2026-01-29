'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ShoppingCart, MessageCircle, Package, Calendar, Gauge, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useCartStore } from '@/store/cart-store'
import { CartDrawer } from '@/components/cart-drawer'
import { ModeToggle } from '@/components/mode-toggle'
import { ProductDetailSkeleton } from '@/components/skeletons/product-skeleton'
import useEmblaCarousel from 'embla-carousel-react'
import { MotorcycleTechnicalSheet } from '@/components/products/MotorcycleTechnicalSheet'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { slug, id } = params
  const [product, setProduct] = useState(null)
  const [dealership, setDealership] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const supabase = createClient()
  const { toast } = useToast()
  const { addItem } = useCartStore()

  // Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  useEffect(() => {
    if (slug && id) {
      fetchProductData()
    }
  }, [slug, id])

  useEffect(() => {
    if (!emblaApi) return

    emblaApi.on('select', () => {
      setSelectedImageIndex(emblaApi.selectedScrollSnap())
    })
  }, [emblaApi])

  const fetchProductData = async () => {
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

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name),
          subcategories (id, name),
          product_images (id, image_url, is_primary, display_order)
        `)
        .eq('id', id)
        .eq('dealership_id', dealershipData.id)
        .single()

      if (productError) throw productError

      // Sort images by display_order
      if (productData.product_images) {
        productData.product_images.sort((a, b) => a.display_order - b.display_order)
      }

      setProduct(productData)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el producto',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    addItem(product)
    toast({
      title: 'Agregado al carrito',
      description: `${product.name} agregado correctamente`,
    })
  }

  const handleWhatsApp = () => {
    const whatsappNumber = settings?.main_whatsapp || dealership?.phone || ''
    const message = `Hola! Estoy interesado en: ${product.name}${product.price ? ` - $${product.price.toLocaleString()}` : ''}. ¿Está disponible?`
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const isMotorcycle = () => {
    return product?.categories?.name?.toLowerCase().includes('moto')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ProductDetailSkeleton />
      </div>
    )
  }

  if (!product || !dealership) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <h1 className="text-4xl font-bold mb-4">Producto no encontrado</h1>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>
    )
  }

  const images = product.product_images || []
  const hasImages = images.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {settings?.logo_url ? (
              <Image
                src={settings.logo_url}
                alt={dealership.name}
                width={120}
                height={48}
                className="object-contain"
              />
            ) : (
              <h1 className="text-xl font-bold text-primary">{dealership.name}</h1>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <ModeToggle />
            <CartDrawer />
          </div>
        </div>
      </header>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {hasImages ? (
              <>
                {/* Main Image Carousel */}
                <div className="overflow-hidden rounded-lg" ref={emblaRef}>
                  <div className="flex">
                    {images.map((image, index) => (
                      <div key={image.id} className="flex-[0_0_100%] min-w-0">
                        <div className="relative aspect-square bg-muted">
                          <Image
                            src={image.image_url}
                            alt={`${product.name} - ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => {
                          emblaApi?.scrollTo(index)
                          setSelectedImageIndex(index)
                        }}
                        className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? 'border-primary scale-105'
                            : 'border-transparent hover:border-muted-foreground'
                        }`}
                      >
                        <Image
                          src={image.image_url}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <Package className="w-32 h-32 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Status */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold pr-4">{product.name}</h1>
                <Badge
                  variant={
                    product.status === 'available'
                      ? 'default'
                      : product.status === 'sold'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="shrink-0"
                >
                  {product.status === 'available'
                    ? 'Disponible'
                    : product.status === 'sold'
                    ? 'Vendido'
                    : 'Reservado'}
                </Badge>
              </div>
              
              {isMotorcycle() && (product.brand || product.model || product.year) && (
                <p className="text-xl text-muted-foreground">
                  {product.brand} {product.model} {product.year}
                </p>
              )}
              
              <p className="text-sm text-muted-foreground mt-1">
                {product.categories?.name}
                {product.subcategories && ` • ${product.subcategories.name}`}
              </p>
            </div>

            {/* Price */}
            {product.price && (
              <div>
                <p className="text-4xl font-bold text-primary">
                  ${product.price.toLocaleString()}
                </p>
              </div>
            )}

            <Separator />

            {/* Specifications */}
            {isMotorcycle() && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-4">Especificaciones</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {product.brand && (
                      <div>
                        <p className="text-sm text-muted-foreground">Marca</p>
                        <p className="font-medium">{product.brand}</p>
                      </div>
                    )}
                    {product.model && (
                      <div>
                        <p className="text-sm text-muted-foreground">Modelo</p>
                        <p className="font-medium">{product.model}</p>
                      </div>
                    )}
                    {product.year && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Año</p>
                          <p className="font-medium">{product.year}</p>
                        </div>
                      </div>
                    )}
                    {product.specifications?.cilindrada && (
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Cilindrada</p>
                          <p className="font-medium">{product.specifications.cilindrada}cc</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Descripción</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.status !== 'available'}
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Agregar al Carrito
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  className="flex-1 bg-[#25D366] hover:bg-[#20BA5A]"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Consultar
                </Button>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href={`/catalogo/${slug}`}>
                  Ver más productos
                </Link>
              </Button>
            </div>

            {/* Contact Info */}
            {(settings?.footer_address || settings?.footer_phone) && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-3">Visítanos</h3>
                  <div className="space-y-2 text-sm">
                    {settings.footer_address && (
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                        <span>{settings.footer_address}</span>
                      </p>
                    )}
                    {settings.footer_phone && (
                      <p className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <span>{settings.footer_phone}</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
