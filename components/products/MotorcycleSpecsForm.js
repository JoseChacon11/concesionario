'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MOTORCYCLE_SPECS_TEMPLATE, SPECS_LABELS } from '@/lib/motorcycle-specs'
import { 
  Zap, 
  Cog, 
  Box, 
  Lightbulb, 
  Ruler, 
  Shield,
  ChevronDown
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

const SECTION_ICONS = {
  motor: Zap,
  transmision: Cog,
  chasis: Box,
  electrico: Lightbulb,
  dimension: Ruler,
  garantia: Shield
}

export function MotorcycleSpecsForm({ specifications = {}, onChange }) {
  const [specs, setSpecs] = useState({
    ...MOTORCYCLE_SPECS_TEMPLATE,
    ...specifications
  })
  const [openSections, setOpenSections] = useState(['motor'])

  const handleFieldChange = (section, field, value) => {
    const newSpecs = {
      ...specs,
      [section]: {
        ...specs[section],
        [field]: value
      }
    }
    setSpecs(newSpecs)
    onChange(newSpecs)
  }

  const toggleSection = (section) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  // Vista móvil: Collapsibles
  const MobileView = () => (
    <div className="space-y-3 lg:hidden">
      {Object.keys(SPECS_LABELS).map((section) => {
        const sectionData = SPECS_LABELS[section]
        const Icon = SECTION_ICONS[section]
        const isOpen = openSections.includes(section)
        
        return (
          <Collapsible 
            key={section} 
            open={isOpen}
            onOpenChange={() => toggleSection(section)}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm">{sectionData.title}</span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid grid-cols-1 gap-3 pl-2">
                {Object.entries(sectionData.fields).map(([fieldKey, fieldLabel]) => (
                  <div key={fieldKey} className="space-y-1.5">
                    <Label htmlFor={`mobile-${section}-${fieldKey}`} className="text-xs">
                      {fieldLabel}
                    </Label>
                    <Input
                      id={`mobile-${section}-${fieldKey}`}
                      value={specs[section]?.[fieldKey] || ''}
                      onChange={(e) => handleFieldChange(section, fieldKey, e.target.value)}
                      placeholder={getPlaceholder(section, fieldKey)}
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )

  // Vista desktop: Tabs
  const DesktopView = () => (
    <div className="hidden lg:block">
      <Tabs defaultValue="motor" className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-auto p-1">
          {Object.keys(SPECS_LABELS).map((section) => {
            const Icon = SECTION_ICONS[section]
            return (
              <TabsTrigger 
                key={section} 
                value={section}
                className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{SPECS_LABELS[section].title}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.keys(SPECS_LABELS).map((section) => {
          const sectionData = SPECS_LABELS[section]
          const Icon = SECTION_ICONS[section]
          
          return (
            <TabsContent key={section} value={section} className="mt-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{sectionData.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Especificaciones de {sectionData.title.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(sectionData.fields).map(([fieldKey, fieldLabel]) => (
                  <div key={fieldKey} className="space-y-1.5">
                    <Label htmlFor={`desktop-${section}-${fieldKey}`} className="text-xs font-medium">
                      {fieldLabel}
                    </Label>
                    <Input
                      id={`desktop-${section}-${fieldKey}`}
                      value={specs[section]?.[fieldKey] || ''}
                      onChange={(e) => handleFieldChange(section, fieldKey, e.target.value)}
                      placeholder={getPlaceholder(section, fieldKey)}
                      className="h-9"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Especificaciones Técnicas
        </CardTitle>
        <CardDescription className="text-xs">
          Completa la ficha técnica detallada de la motocicleta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MobileView />
        <DesktopView />
      </CardContent>
    </Card>
  )
}

function getPlaceholder(section, field) {
  const placeholders = {
    motor: {
      motor: 'Monocilíndrico, 4 tiempos',
      potencia_maxima: '15.4 HP @ 8500 rpm',
      torque_maximo: '13.8 Nm @ 7000 rpm',
      diametro_carrera: '57.3 x 57.8 mm',
      relacion_compresion: '10.0:1',
      sistema_combustible: 'Inyección electrónica',
      enfriamiento: 'Refrigerado por aire'
    },
    transmision: {
      tipo: 'Manual',
      embrague: 'Húmedo multidisco',
      transmision: '5 velocidades',
      unidad_final: 'Cadena'
    },
    chasis: {
      suspension_delantera: 'Telescópica hidráulica',
      suspension_trasera: 'Basculante con amortiguador',
      frenos_delantero: 'Disco 240mm',
      frenos_trasero: 'Tambor 110mm',
      cauchos_delantero: '2.75-18',
      cauchos_trasero: '3.00-17',
      capacidad_combustible: '12 litros',
      color: 'Negro, Rojo, Azul'
    },
    electrico: {
      encendido: 'CDI',
      bujias: 'NGK CR7E',
      faro: 'LED',
      luz_freno: 'LED',
      luces_cruce: 'Halógeno'
    },
    dimension: {
      tamano_caja: 'N/A',
      longitud: '2045 mm',
      ancho: '765 mm',
      altura: '1090 mm',
      distancia_ejes: '1285 mm',
      capacidad_carga: '150 kg',
      peso: '135 kg'
    },
    garantia: {
      tiempo: '1 año o 10,000 km'
    }
  }

  return placeholders[section]?.[field] || ''
}
