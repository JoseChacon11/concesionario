'use client'

import { useState, useEffect } from 'react'
import { useDealership } from '@/contexts/DealershipContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Loader2, Users, Upload, X } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import Image from 'next/image'

export default function EmployeesPage() {
  const { dealership, loading: dealershipLoading } = useDealership()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const { toast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    phone: '',
    whatsapp: '',
    email: '',
    is_active: true,
  })

  useEffect(() => {
    if (dealership?.id) {
      fetchEmployees()
    }
  }, [dealership])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('dealership_id', dealership.id)
        .order('display_order', { ascending: true })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los empleados',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async () => {
    if (!photoFile) return null

    const fileExt = photoFile.name.split('.').pop()
    const fileName = `${dealership.id}/employees/${Date.now()}.${fileExt}`

    try {
      const { data, error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, photoFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: 'Error',
        description: 'Error subiendo la foto',
        variant: 'destructive',
      })
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      let photoUrl = editingEmployee?.photo_url || ''

      if (photoFile) {
        const uploadedUrl = await uploadPhoto()
        if (uploadedUrl) {
          photoUrl = uploadedUrl
        }
      }

      const employeeData = {
        dealership_id: dealership.id,
        full_name: formData.full_name,
        position: formData.position || null,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        photo_url: photoUrl || null,
        is_active: formData.is_active,
      }

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id)

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'Empleado actualizado correctamente',
        })
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([employeeData])

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'Empleado creado correctamente',
        })
      }

      fetchEmployees()
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
        .from('employees')
        .delete()
        .eq('id', deleteTarget)

      if (error) throw error

      toast({
        title: 'Éxito',
        description: 'Empleado eliminado correctamente',
      })
      fetchEmployees()
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
      full_name: '',
      position: '',
      phone: '',
      whatsapp: '',
      email: '',
      is_active: true,
    })
    setEditingEmployee(null)
    setPhotoFile(null)
    setPhotoPreview('')
  }

  const openEdit = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      full_name: employee.full_name,
      position: employee.position || '',
      phone: employee.phone || '',
      whatsapp: employee.whatsapp || '',
      email: employee.email || '',
      is_active: employee.is_active,
    })
    setPhotoPreview(employee.photo_url || '')
    setDialogOpen(true)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empleados</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tu equipo de trabajo con contacto directo
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                </DialogTitle>
                <DialogDescription>
                  Agrega los datos de contacto y foto del empleado
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Foto del Empleado</Label>
                  <div className="flex items-center space-x-4">
                    {photoPreview && (
                      <div className="relative">
                        <Image
                          src={photoPreview}
                          alt="Preview"
                          width={100}
                          height={100}
                          className="rounded-full object-cover w-20 h-20"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                          onClick={() => {
                            setPhotoFile(null)
                            setPhotoPreview('')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload">
                        <Button type="button" variant="outline" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Subir Foto
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo *</Label>
                  <Input
                    id="full_name"
                    placeholder="Juan Pérez"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo/Posición</Label>
                  <Input
                    id="position"
                    placeholder="Vendedor, Gerente, Mecánico..."
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      placeholder="+58 414 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      placeholder="+58 414 123 4567"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="empleado@concesionario.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Activo (visible en landing page)
                  </Label>
                </div>
              </div>
              <DialogFooter>
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
                    editingEmployee ? 'Actualizar' : 'Crear'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipo de Trabajo</CardTitle>
          <CardDescription>Lista de empleados visibles en tu landing page</CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No hay empleados aún</p>
              <p className="text-sm">Agrega miembros de tu equipo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <Card key={employee.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      {employee.photo_url ? (
                        <Image
                          src={employee.photo_url}
                          alt={employee.full_name}
                          width={80}
                          height={80}
                          className="rounded-full object-cover w-20 h-20"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {employee.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{employee.full_name}</h3>
                        {employee.position && (
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        )}
                      </div>
                      {employee.whatsapp && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(`https://wa.me/${employee.whatsapp.replace(/[^0-9]/g, '')}`, '_blank')}
                        >
                          Contactar por WhatsApp
                        </Button>
                      )}
                      <div className="flex space-x-2 w-full">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(employee)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setDeleteTarget(employee.id)
                            setDeleteAlertOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {!employee.is_active && (
                        <span className="text-xs text-muted-foreground">(Inactivo)</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El empleado será eliminado permanentemente.
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
