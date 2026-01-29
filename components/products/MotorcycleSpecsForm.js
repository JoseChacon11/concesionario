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
  Shield 
} from 'lucide-react'

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Especificaciones Técnicas</CardTitle>
        <CardDescription>
          Completa la ficha técnica detallada de la motocicleta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="motor" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {Object.keys(SPECS_LABELS).map((section) => {
              const Icon = SECTION_ICONS[section]
              return (
                <TabsTrigger 
                  key={section} 
                  value={section}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{SPECS_LABELS[section].title}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {Object.keys(SPECS_LABELS).map((section) => {
            const sectionData = SPECS_LABELS[section]
            const Icon = SECTION_ICONS[section]
            
            return (
              <TabsContent key={section} value={section} className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{sectionData.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Especificaciones de {sectionData.title.toLowerCase()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(sectionData.fields).map(([fieldKey, fieldLabel]) => (
                    <div key={fieldKey} className="space-y-2">
                      <Label htmlFor={`${section}-${fieldKey}`}>
                        {fieldLabel}
                      </Label>
                      <Input
                        id={`${section}-${fieldKey}`}
                        value={specs[section]?.[fieldKey] || ''}
                        onChange={(e) => handleFieldChange(section, fieldKey, e.target.value)}
                        placeholder={`Ej: ${getPlaceholder(section, fieldKey)}`}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
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
