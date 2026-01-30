'use client'

import { DialogClose } from "@/components/ui/dialog"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ShoppingCart, MessageCircle, Package, Calendar, Gauge, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useCartStore } from '@/store/cart-store'
import { CartDrawer } from '@/components/cart-drawer'
import { ModeToggle } from '@/components/mode-toggle'
import { ProductDetailSkeleton } from '@/components/skeletons/product-skeleton'
import useEmblaCarousel from 'embla-carousel-react'
import { MotorcycleTechnicalSheet } from '@/components/products/MotorcycleTechnicalSheet'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { slug, id } = params
  const [product, setProduct] = useState(null)
  const [dealership, setDealership] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
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

      // Fetch related products (same category)
      if (productData.category_id) {
        const { data: related } = await supabase
          .from('products')
          .select(`
            *,
            categories (id, name),
            subcategories (id, name),
            product_images (image_url, is_primary)
          `)
          .eq('category_id', productData.category_id)
          .eq('dealership_id', dealershipData.id)
          .neq('id', id)
          .eq('status', 'available')
          .limit(4)

        setRelatedProducts(related || [])
      }
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
              <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
            </Button>
            {settings?.logo_url ? (
              <Image
                src={settings.logo_url || "/placeholder.svg"}
                alt={dealership.name}
                width={120}
                height={48}
                className="object-contain max-h-10 sm:max-h-12 w-auto"
              />
            ) : (
              <h1 className="text-sm sm:text-lg font-bold text-primary truncate">{dealership.name}</h1>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ModeToggle />
            <CartDrawer />
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-3 sm:px-4 pb-2 sm:pb-3 overflow-x-auto">
          <Breadcrumb>
            <BreadcrumbList className="text-xs sm:text-sm whitespace-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/catalogo/${slug}`}>Inicio</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {product?.categories && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/catalogo/${slug}?category=${product.categories.id}`} className="truncate">
                        {product.categories.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {product?.subcategories && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/catalogo/${slug}?subcategory=${product.subcategories.id}`} className="truncate">
                        {product.subcategories.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate">{product?.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Product Detail */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
          {/* Left Column: Image Gallery */}
          <div className="space-y-3 sm:space-y-4 md:sticky md:top-[200px] md:h-fit">
            {hasImages ? (
              <>
                {/* Main Image */}
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="relative group overflow-hidden rounded-lg cursor-zoom-in"
                >
                  <div className="relative w-full aspect-square md:aspect-auto md:max-h-[600px] bg-muted">
                    <Image
                      src={images[selectedImageIndex]?.image_url || '/placeholder.svg'}
                      alt={`${product.name} - ${selectedImageIndex + 1}`}
                      width={600}
                      height={600}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      priority
                    />
                  </div>
                  <div className="hidden sm:flex absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-xs sm:text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
                      Ampliar
                    </div>
                  </div>
                </button>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => {
                          emblaApi?.scrollTo(index)
                          setSelectedImageIndex(index)
                        }}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                          selectedImageIndex === index
                            ? 'border-primary ring-2 ring-primary/50'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <Image
                          src={image.image_url || "/placeholder.svg"}
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

          {/* Lightbox Dialog */}
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-0">
              <div className="relative w-full aspect-square flex items-center justify-center">
                <Image
                  src={images[selectedImageIndex]?.image_url || '/placeholder.svg'}
                  alt={`${product.name} - ${selectedImageIndex + 1}`}
                  width={1000}
                  height={1000}
                  className="object-contain w-full h-full max-h-[90vh]"
                />

                {/* Navigation Buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImageIndex(
                          selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImageIndex(
                          selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Right Column: Product Info */}
          <div className="space-y-4 sm:space-y-6 md:space-y-6 flex flex-col justify-start">
            {/* Title and Status */}
            <div>
              <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2 sm:mb-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">{product.name}</h1>
                <Badge
                  variant={
                    product.status === 'available'
                      ? 'default'
                      : product.status === 'sold'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="shrink-0 text-xs sm:text-sm"
                >
                  {product.status === 'available'
                    ? 'Disponible'
                    : product.status === 'sold'
                    ? 'Vendido'
                    : 'Reservado'}
                </Badge>
              </div>

              {isMotorcycle() && (product.brand || product.model || product.year) && (
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-2 sm:mb-3">
                  {product.brand} {product.model} {product.year}
                </p>
              )}

              {(product.categories || product.subcategories) && (
                <div className="flex gap-2 flex-wrap">
                  {product.categories && (
                    <Badge variant="outline" className="text-xs">{product.categories.name}</Badge>
                  )}
                  {product.subcategories && (
                    <Badge variant="outline" className="text-xs">{product.subcategories.name}</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Price */}
            {product.price && (
              <div className="py-3 sm:py-4 border-y">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">
                  ${product.price.toLocaleString()}
                </p>
              </div>
            )}

            {/* Quick Specs Card */}
            {isMotorcycle() && (product.brand || product.model || product.year || product.specifications?.cilindrada) && (
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">Datos Rápidos</h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  {product.brand && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marca</span>
                      <span className="font-medium">{product.brand}</span>
                    </div>
                  )}
                  {product.model && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modelo</span>
                      <span className="font-medium">{product.model}</span>
                    </div>
                  )}
                  {product.year && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Año</span>
                      <span className="font-medium">{product.year}</span>
                    </div>
                  )}
                  {product.specifications?.cilindrada && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cilindrada</span>
                      <span className="font-medium">{product.specifications.cilindrada}cc</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-3 mt-auto">
              <Button
                onClick={handleAddToCart}
                disabled={product.status !== 'available'}
                className="w-full h-10 sm:h-11"
                size="sm"
              >
                <ShoppingCart className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Agregar al Carrito</span>
              </Button>
              <Button
                onClick={handleWhatsApp}
                className="w-full h-10 sm:h-11 bg-[#25D366] hover:bg-[#20BA5A]"
                size="sm"
              >
                <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Consultar por WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {product.description && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Descripción</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Motorcycle Technical Sheet - Full Width */}
        {isMotorcycle() && product.specifications && (
          <div className="mt-8 sm:mt-12">
            <MotorcycleTechnicalSheet
              specifications={product.specifications}
              productImage={images[0]?.image_url}
            />
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Productos Relacionados</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {relatedProducts.map((relatedProduct) => {
                const primaryImage = relatedProduct.product_images?.find(
                  (img) => img.is_primary
                ) || relatedProduct.product_images?.[0]

                return (
                  <Link key={relatedProduct.id} href={`/catalogo/${slug}/producto/${relatedProduct.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] group cursor-pointer h-full flex flex-col">
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        {primaryImage?.image_url ? (
                          <Image
                            src={primaryImage.image_url || "/placeholder.svg"}
                            alt={relatedProduct.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="w-16 h-16 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <CardContent className="pt-4 pb-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{relatedProduct.name}</h3>
                        {relatedProduct.brand && relatedProduct.model && (
                          <p className="text-xs text-muted-foreground mb-3">
                            {relatedProduct.brand} {relatedProduct.model}
                          </p>
                        )}
                        {relatedProduct.price && (
                          <p className="text-lg font-bold text-primary mt-auto">
                            ${relatedProduct.price.toLocaleString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
