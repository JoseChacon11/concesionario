'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Zap, 
  Cog, 
  Box, 
  Lightbulb, 
  Ruler, 
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { SPECS_LABELS } from '@/lib/motorcycle-specs'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const SECTION_ICONS = {
  motor: Zap,
  transmision: Cog,
  chasis: Box,
  electrico: Lightbulb,
  dimension: Ruler,
  garantia: Shield
}

const SECTION_COLORS = {
  motor: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  transmision: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  chasis: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  electrico: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  dimension: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  garantia: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
}

export function MotorcycleTechnicalSheet({ specifications }) {
  const [expandedSections, setExpandedSections] = useState({
    motor: true,
    transmision: true,
    chasis: false,
    electrico: false,
    dimension: false,
    garantia: true
  })

  if (!specifications || Object.keys(specifications).length === 0) {
    return null
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const hasData = (section) => {
    return specifications[section] && Object.values(specifications[section]).some(val => val && val.trim() !== '')
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          Ficha Técnica Completa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.keys(SPECS_LABELS).map((section) => {
          if (!hasData(section)) return null
          
          const sectionData = SPECS_LABELS[section]
          const Icon = SECTION_ICONS[section]
          const isExpanded = expandedSections[section]
          
          return (
            <div key={section} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section)}
                className={cn(
                  'w-full p-4 flex items-center justify-between transition-colors hover:bg-accent',
                  SECTION_COLORS[section]
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">{sectionData.title}</h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              
              {isExpanded && (
                <div className="p-4 bg-card space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(sectionData.fields).map(([fieldKey, fieldLabel]) => {
                      const value = specifications[section]?.[fieldKey]
                      if (!value || value.trim() === '') return null
                      
                      return (
                        <div key={fieldKey} className="flex flex-col">
                          <span className="text-sm text-muted-foreground mb-1">
                            {fieldLabel}
                          </span>
                          <span className="font-medium">{value}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function MotorcycleSpecsBadge({ specifications }) {
  if (!specifications || Object.keys(specifications).length === 0) {
    return null
  }

  const mainSpecs = []
  
  if (specifications.motor?.potencia_maxima) {
    mainSpecs.push(specifications.motor.potencia_maxima)
  }
  if (specifications.motor?.motor) {
    mainSpecs.push(specifications.motor.motor)
  }
  
  if (mainSpecs.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {mainSpecs.map((spec, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {spec}
        </Badge>
      ))}
    </div>
  )
}
