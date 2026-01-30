'use client'

import { useState, useEffect } from 'react'
import { useDealership } from '@/contexts/DealershipContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Loader2, Grid3x3, Search } from 'lucide-react'
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

export default function CategoriesPage() {
  const { dealership, loading: dealershipLoading } = useDealership()
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [subDialogOpen, setSubDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [searchSubcategory, setSearchSubcategory] = useState('')
  const { toast } = useToast()
  const supabase = createClient()

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [subFormData, setSubFormData] = useState({
    category_id: '',
    name: '',
    description: '',
  })

  useEffect(() => {
    if (dealership?.id) {
      fetchCategories()
      fetchSubcategories()
    }
  }, [dealership])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('dealership_id', dealership.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          categories (name)
        `)
        .eq('dealership_id', dealership.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubcategories(data || [])
    } catch (error) {
      console.error('Error fetching subcategories:', error)
    }
  }

  const handleSubmitCategory = async (e) => {
    e.preventDefault()
    
    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-')
      const categoryData = {
        dealership_id: dealership.id,
        name: formData.name,
        slug,
        description: formData.description,
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id)

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'Categoría actualizada correctamente',
        })
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData])

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'Categoría creada correctamente',
        })
      }

      fetchCategories()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleSubmitSubcategory = async (e) => {
    e.preventDefault()
    
    try {
      const slug = subFormData.name.toLowerCase().replace(/\s+/g, '-')
      const subcategoryData = {
        dealership_id: dealership.id,
        category_id: subFormData.category_id,
        name: subFormData.name,
        slug,
        description: subFormData.description,
      }

      if (editingSubcategory) {
        const { error } = await supabase
          .from('subcategories')
          .update(subcategoryData)
          .eq('id', editingSubcategory.id)

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'Subcategoría actualizada correctamente',
        })
      } else {
        const { error } = await supabase
          .from('subcategories')
          .insert([subcategoryData])

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'Subcategoría creada correctamente',
        })
      }

      fetchSubcategories()
      setSubDialogOpen(false)
      resetSubForm()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    try {
      if (deleteTarget.type === 'category') {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', deleteTarget.id)

        if (error) throw error
        fetchCategories()
        fetchSubcategories()
      } else {
        const { error } = await supabase
          .from('subcategories')
          .delete()
          .eq('id', deleteTarget.id)

        if (error) throw error
        fetchSubcategories()
      }

      toast({
        title: 'Éxito',
        description: `${deleteTarget.type === 'category' ? 'Categoría' : 'Subcategoría'} eliminada correctamente`,
      })
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
    setFormData({ name: '', description: '' })
    setEditingCategory(null)
  }

  const resetSubForm = () => {
    setSubFormData({ category_id: '', name: '', description: '' })
    setEditingSubcategory(null)
  }

  const openEditCategory = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
    })
    setDialogOpen(true)
  }

  const openEditSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory)
    setSubFormData({
      category_id: subcategory.category_id,
      name: subcategory.name,
      description: subcategory.description || '',
    })
    setSubDialogOpen(true)
  }

  const filteredSubcategories = subcategories.filter((sub) =>
    sub.name.toLowerCase().includes(searchSubcategory.toLowerCase())
  )

  if (dealershipLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorías y Subcategorías</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las categorías de productos de tu concesionario
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* CATEGORÍAS */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="sticky top-0 bg-card z-10 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Categorías Principales</CardTitle>
                <CardDescription>Motos, Accesorios, Repuestos</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmitCategory}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                      </DialogTitle>
                      <DialogDescription>
                        Crea categorías principales para organizar tus productos
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="cat-name">Nombre *</Label>
                        <Input
                          id="cat-name"
                          placeholder="Ej: Motos, Accesorios, Repuestos"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cat-description">Descripción</Label>
                        <Textarea
                          id="cat-description"
                          placeholder="Descripción opcional"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingCategory ? 'Actualizar' : 'Crear'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Grid3x3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No hay categorías aún</p>
              </div>
            ) : (
              <div className="space-y-1">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="p-3 rounded-md hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{category.name}</p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            Categoría
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditCategory(category)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeleteTarget({ id: category.id, type: 'category' })
                            setDeleteAlertOpen(true)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SUBCATEGORÍAS */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="sticky top-0 bg-card z-10 border-b space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subcategorías</CardTitle>
                <CardDescription>Clásicas, Scooters, Cascos, etc.</CardDescription>
              </div>
              <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetSubForm} disabled={categories.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <form onSubmit={handleSubmitSubcategory}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingSubcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
                      </DialogTitle>
                      <DialogDescription>
                        Las subcategorías deben pertenecer a una categoría principal
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="sub-category">Categoría Principal *</Label>
                        <select
                          id="sub-category"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={subFormData.category_id}
                          onChange={(e) => setSubFormData({ ...subFormData, category_id: e.target.value })}
                          required
                        >
                          <option value="">Selecciona una categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sub-name">Nombre *</Label>
                        <Input
                          id="sub-name"
                          placeholder="Ej: Clásicas, Scooters, Cascos"
                          value={subFormData.name}
                          onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sub-description">Descripción</Label>
                        <Textarea
                          id="sub-description"
                          placeholder="Descripción opcional"
                          value={subFormData.description}
                          onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setSubDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingSubcategory ? 'Actualizar' : 'Crear'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar subcategorías..."
                value={searchSubcategory}
                onChange={(e) => setSearchSubcategory(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {filteredSubcategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Grid3x3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>
                  {subcategories.length === 0
                    ? 'No hay subcategorías aún'
                    : 'No se encontraron resultados'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSubcategories.map((subcategory) => (
                  <div
                    key={subcategory.id}
                    className="p-3 rounded-md hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{subcategory.name}</p>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {subcategory.categories?.name}
                          </Badge>
                        </div>
                        {subcategory.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {subcategory.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditSubcategory(subcategory)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeleteTarget({ id: subcategory.id, type: 'subcategory' })
                            setDeleteAlertOpen(true)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente.
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
