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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, X, Save } from 'lucide-react'
import Image from 'next/image'

export default function SettingsPage() {
  const { dealership, loading: dealershipLoading } = useDealership()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [heroFile, setHeroFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [heroPreview, setHeroPreview] = useState('')
  const { toast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    hero_title: '',
    hero_subtitle: '',
    footer_text: '',
    footer_address: '',
    footer_phone: '',
    footer_email: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    tiktok_url: '',
    youtube_url: '',
    main_whatsapp: '',
    primary_color: '#000000',
    secondary_color: '#666666',
  })

  useEffect(() => {
    if (dealership?.id) {
      fetchSettings()
    }
  }, [dealership])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('dealership_id', dealership.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setSettings(data)
        setFormData({
          hero_title: data.hero_title || '',
          hero_subtitle: data.hero_subtitle || '',
          footer_text: data.footer_text || '',
          footer_address: data.footer_address || '',
          footer_phone: data.footer_phone || '',
          footer_email: data.footer_email || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          twitter_url: data.twitter_url || '',
          tiktok_url: data.tiktok_url || '',
          youtube_url: data.youtube_url || '',
          main_whatsapp: data.main_whatsapp || '',
          primary_color: data.primary_color || '#000000',
          secondary_color: data.secondary_color || '#666666',
        })
        setLogoPreview(data.logo_url || '')
        setHeroPreview(data.hero_image_url || '')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === 'logo') {
        setLogoFile(file)
      } else {
        setHeroFile(file)
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'logo') {
          setLogoPreview(reader.result)
        } else {
          setHeroPreview(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadFile = async (file, path) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${dealership.id}/${path}/${Date.now()}.${fileExt}`

    try {
      const { data, error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Error',
        description: 'Error subiendo archivo',
        variant: 'destructive',
      })
      return null
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      let logoUrl = settings?.logo_url || ''
      let heroImageUrl = settings?.hero_image_url || ''

      if (logoFile) {
        const uploadedUrl = await uploadFile(logoFile, 'logos')
        if (uploadedUrl) logoUrl = uploadedUrl
      }

      if (heroFile) {
        const uploadedUrl = await uploadFile(heroFile, 'hero')
        if (uploadedUrl) heroImageUrl = uploadedUrl
      }

      const settingsData = {
        dealership_id: dealership.id,
        logo_url: logoUrl || null,
        hero_image_url: heroImageUrl || null,
        ...formData,
      }

      if (settings) {
        const { error } = await supabase
          .from('site_settings')
          .update(settingsData)
          .eq('id', settings.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([settingsData])

        if (error) throw error
      }

      toast({
        title: 'Éxito',
        description: 'Configuración guardada correctamente',
      })

      fetchSettings()
      setLogoFile(null)
      setHeroFile(null)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-3xl font-bold">Configuración del Sitio</h1>
          <p className="text-muted-foreground mt-2">
            Personaliza tu landing page pública
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="hero">Hero Banner</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="social">Redes Sociales</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo del Concesionario</CardTitle>
              <CardDescription>
                Logo que aparecerá en el header de tu landing page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoPreview && (
                <div className="relative inline-block">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={200}
                    height={100}
                    className="rounded-lg object-contain bg-slate-50 p-4"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => {
                      setLogoFile(null)
                      setLogoPreview('')
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
                  onChange={(e) => handleFileSelect(e, 'logo')}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Logo
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Colores</CardTitle>
              <CardDescription>
                Personaliza los colores de tu sitio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Color Primario</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Color Secundario</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#666666"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Banner Hero</CardTitle>
              <CardDescription>
                Imagen y texto principal de tu landing page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Imagen de Fondo</Label>
                {heroPreview && (
                  <div className="relative inline-block">
                    <Image
                      src={heroPreview}
                      alt="Hero preview"
                      width={400}
                      height={200}
                      className="rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      onClick={() => {
                        setHeroFile(null)
                        setHeroPreview('')
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
                    onChange={(e) => handleFileSelect(e, 'hero')}
                    className="hidden"
                    id="hero-upload"
                  />
                  <label htmlFor="hero-upload">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Imagen Hero
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_title">Título Principal</Label>
                <Input
                  id="hero_title"
                  placeholder="Bienvenido a tu concesionario"
                  value={formData.hero_title}
                  onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_subtitle">Subtítulo</Label>
                <Input
                  id="hero_subtitle"
                  placeholder="Las mejores motos al mejor precio"
                  value={formData.hero_subtitle}
                  onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Footer</CardTitle>
              <CardDescription>
                Datos de contacto que aparecerán al final de tu landing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footer_text">Texto del Footer</Label>
                <Textarea
                  id="footer_text"
                  placeholder="© 2025 Tu Concesionario. Todos los derechos reservados."
                  value={formData.footer_text}
                  onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_address">Dirección</Label>
                <Input
                  id="footer_address"
                  placeholder="Calle Principal, Ciudad, País"
                  value={formData.footer_address}
                  onChange={(e) => setFormData({ ...formData, footer_address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="footer_phone">Teléfono</Label>
                  <Input
                    id="footer_phone"
                    placeholder="+58 414 123 4567"
                    value={formData.footer_phone}
                    onChange={(e) => setFormData({ ...formData, footer_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer_email">Email</Label>
                  <Input
                    id="footer_email"
                    type="email"
                    placeholder="info@concesionario.com"
                    value={formData.footer_email}
                    onChange={(e) => setFormData({ ...formData, footer_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_whatsapp">WhatsApp Principal</Label>
                <Input
                  id="main_whatsapp"
                  placeholder="+58 414 123 4567"
                  value={formData.main_whatsapp}
                  onChange={(e) => setFormData({ ...formData, main_whatsapp: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
              <CardDescription>
                Enlaces a tus perfiles de redes sociales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook_url">Facebook</Label>
                <Input
                  id="facebook_url"
                  placeholder="https://facebook.com/tupage"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram</Label>
                <Input
                  id="instagram_url"
                  placeholder="https://instagram.com/tupage"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_url">Twitter / X</Label>
                <Input
                  id="twitter_url"
                  placeholder="https://twitter.com/tupage"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok_url">TikTok</Label>
                <Input
                  id="tiktok_url"
                  placeholder="https://tiktok.com/@tupage"
                  value={formData.tiktok_url}
                  onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_url">YouTube</Label>
                <Input
                  id="youtube_url"
                  placeholder="https://youtube.com/@tupage"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
