'use client'

import { useState, useEffect } from 'react'
import { useDealership } from '@/contexts/DealershipContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Loader2, Package, Upload, X, Image as ImageIcon } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'
import { MotorcycleSpecsForm } from '@/components/products/MotorcycleSpecsForm'
import { MOTORCYCLE_SPECS_TEMPLATE } from '@/lib/motorcycle-specs'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function ProductsPage() {
  const { dealership, loading: dealershipLoading } = useDealership()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [filteredSubcategories, setFilteredSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [specifications, setSpecifications] = useState({})
  const { toast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    subcategory_id: '',
    brand: '',
    model: '',
    year: '',
    price: '',
    description: '',
    status: 'available',
  })

  useEffect(() => {
    if (dealership?.id) {
      fetchCategories()
      fetchSubcategories()
      fetchProducts()
    }
  }, [dealership])

  useEffect(() => {
    if (formData.category_id) {
      const filtered = subcategories.filter(
        (sub) => sub.category_id === formData.category_id
      )
      setFilteredSubcategories(filtered)
    } else {
      setFilteredSubcategories([])
    }
  }, [formData.category_id, subcategories])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('dealership_id', dealership.id)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('dealership_id', dealership.id)
        .order('name')

      if (error) throw error
      setSubcategories(data || [])
    } catch (error) {
      console.error('Error fetching subcategories:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          subcategories (name),
          product_images (id, image_url, is_primary)
        `)
        .eq('dealership_id', dealership.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    setImageFiles((prev) => [...prev, ...files])
  }

  const removeImageFile = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageId) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)

      if (error) throw error

      setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
      toast({
        title: 'Éxito',
        description: 'Imagen eliminada',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const uploadImages = async (productId) => {
    const uploadedUrls = []

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${dealership.id}/${productId}/${Date.now()}-${i}.${fileExt}`

      try {
        const { data, error: uploadError } = await supabase.storage
          .from('motorcycles')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('motorcycles')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
      } catch (error) {
        console.error('Error uploading image:', error)
        toast({
          title: 'Error',
          description: `Error subiendo imagen ${file.name}`,
          variant: 'destructive',
        })
      }
    }

    // Save image URLs to database
    if (uploadedUrls.length > 0) {
      const imageRecords = uploadedUrls.map((url, index) => ({
        product_id: productId,
        dealership_id: dealership.id,
        image_url: url,
        is_primary: existingImages.length === 0 && index === 0,
        display_order: existingImages.length + index,
      }))

      const { error: insertError } = await supabase
        .from('product_images')
        .insert(imageRecords)

      if (insertError) {
        console.error('Error saving image records:', insertError)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-')
      const isMotorcycle = getCategoryName(formData.category_id).toLowerCase().includes('moto')
      const productData = {
        dealership_id: dealership.id,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        name: formData.name,
        slug,
        brand: formData.brand || null,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        description: formData.description || null,
        status: formData.status,
        specifications: isMotorcycle ? specifications : null,
      }

      let productId

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
        productId = editingProduct.id

        toast({
          title: 'Éxito',
          description: 'Producto actualizado correctamente',
        })
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single()

        if (error) throw error
        productId = data.id

        toast({
          title: 'Éxito',
          description: 'Producto creado correctamente',
        })
      }

      // Upload images
      if (imageFiles.length > 0) {
        await uploadImages(productId)
      }

      fetchProducts()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteTarget)

      if (error) throw error

      toast({
        title: 'Éxito',
        description: 'Producto eliminado correctamente',
      })
      fetchProducts()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setDeleteAlertOpen(false)
      setDeleteTarget(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      subcategory_id: '',
      brand: '',
      model: '',
      year: '',
      price: '',
      description: '',
      status: 'available',
    })
    setEditingProduct(null)
    setImageFiles([])
    setExistingImages([])
    setSpecifications({})
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category_id: product.category_id || '',
      subcategory_id: product.subcategory_id || '',
      brand: product.brand || '',
      model: product.model || '',
      year: product.year ? product.year.toString() : '',
      price: product.price ? product.price.toString() : '',
      description: product.description || '',
      status: product.status,
    })
    setExistingImages(product.product_images || [])
    setSpecifications(product.specifications || {})
    setDialogOpen(true)
  }

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId)
    return cat?.name || ''
  }

  const isMotorcycleCategory = () => {
    const catName = getCategoryName(formData.category_id)
    return catName.toLowerCase().includes('moto')
  }

  if (dealershipLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tu inventario de motos, accesorios y repuestos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={categories.length === 0} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <DialogHeader className="pb-4">
                <DialogTitle>
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </DialogTitle>
                <DialogDescription>
                  Los campos cambian según la categoría seleccionada
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 pb-4">
                {/* Categoría y Subcategoría - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
                      required
                    >
                      <option value="">Selecciona categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategoría</Label>
                    <select
                      id="subcategory"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.subcategory_id}
                      onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                      disabled={!formData.category_id}
                    >
                      <option value="">Selecciona subcategoría</option>
                      {filteredSubcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nombre del Producto */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Honda CBR 500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Campos específicos de Motos - Responsive */}
                {isMotorcycleCategory() && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marca</Label>
                      <Input
                        id="brand"
                        placeholder="Honda, Yamaha..."
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Input
                        id="model"
                        placeholder="CBR 500"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Año</Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder="2024"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Precio y Estado - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado *</Label>
                    <select
                      id="status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      required
                    >
                      <option value="available">Disponible</option>
                      <option value="sold">Vendido</option>
                      <option value="reserved">Reservado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe el producto..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Imágenes */}
                <div className="space-y-4">
                  <Label>Imágenes</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <div className="p-3 rounded-full bg-primary/10 mb-3">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium">Click para subir imágenes</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP hasta 10MB</p>
                    </label>
                  </div>

                  {/* Imágenes existentes */}
                  {existingImages.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Imágenes actuales:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {existingImages.map((img) => (
                          <div key={img.id} className="relative group aspect-square">
                            <Image
                              src={img.image_url}
                              alt="Product"
                              fill
                              className="rounded-lg object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeExistingImage(img.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            {img.is_primary && (
                              <Badge className="absolute bottom-2 left-2 text-xs">Principal</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nuevas imágenes a subir - Bug corregido */}
                  {imageFiles.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Nuevas imágenes a subir:</p>
                      <div className="space-y-2">
                        {imageFiles.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/50"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="p-2 rounded bg-primary/10 shrink-0">
                                <ImageIcon className="h-4 w-4 text-primary" />
                              </div>
                              <span className="text-sm truncate">{file.name}</span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeImageFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Motorcycle Specifications */}
                {isMotorcycleCategory() && (
                  <div className="mt-4">
                    <MotorcycleSpecsForm
                      specifications={specifications}
                      onChange={setSpecifications}
                    />
                  </div>
                )}
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingProduct ? 'Actualizar' : 'Crear'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
          <CardDescription>Lista de todos tus productos</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No hay productos aún</p>
              <p className="text-sm">Crea tu primer producto para empezar</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Producto</TableHead>
                      <TableHead className="min-w-[120px]">Categoría</TableHead>
                      <TableHead className="min-w-[100px]">Precio</TableHead>
                      <TableHead className="min-w-[100px]">Estado</TableHead>
                      <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const primaryImage = product.product_images?.find((img) => img.is_primary) || product.product_images?.[0]
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {primaryImage ? (
                                <div className="relative w-12 h-12 shrink-0">
                                  <Image
                                    src={primaryImage.image_url}
                                    alt={product.name}
                                    fill
                                    className="rounded-lg object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate">{product.name}</p>
                                {product.brand && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {product.brand} {product.model} {product.year}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{product.categories?.name}</span>
                              {product.subcategories && (
                                <span className="text-xs text-muted-foreground">
                                  {product.subcategories.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {product.price ? `$${product.price.toLocaleString()}` : '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
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
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => openEdit(product)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeleteTarget(product.id)
                                  setDeleteAlertOpen(true)
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
