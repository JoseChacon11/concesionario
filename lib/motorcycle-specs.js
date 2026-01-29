// Constantes para especificaciones de motos
export const MOTORCYCLE_SPECS_TEMPLATE = {
  motor: {
    motor: '',
    potencia_maxima: '',
    torque_maximo: '',
    diametro_carrera: '',
    relacion_compresion: '',
    sistema_combustible: '',
    enfriamiento: ''
  },
  transmision: {
    tipo: '',
    embrague: '',
    transmision: '',
    unidad_final: ''
  },
  chasis: {
    suspension_delantera: '',
    suspension_trasera: '',
    frenos_delantero: '',
    frenos_trasero: '',
    cauchos_delantero: '',
    cauchos_trasero: '',
    capacidad_combustible: '',
    color: ''
  },
  electrico: {
    encendido: '',
    bujias: '',
    faro: '',
    luz_freno: '',
    luces_cruce: ''
  },
  dimension: {
    tamano_caja: '',
    longitud: '',
    ancho: '',
    altura: '',
    distancia_ejes: '',
    capacidad_carga: '',
    peso: ''
  },
  garantia: {
    tiempo: ''
  }
}

export const SPECS_LABELS = {
  motor: {
    title: 'Motor',
    fields: {
      motor: 'Tipo de Motor',
      potencia_maxima: 'Potencia Máxima',
      torque_maximo: 'Torque Máximo',
      diametro_carrera: 'Diámetro x Carrera',
      relacion_compresion: 'Relación de Compresión',
      sistema_combustible: 'Sistema de Combustible',
      enfriamiento: 'Enfriamiento'
    }
  },
  transmision: {
    title: 'Transmisión',
    fields: {
      tipo: 'Tipo',
      embrague: 'Embrague/Clutch',
      transmision: 'Transmisión',
      unidad_final: 'Unidad Final'
    }
  },
  chasis: {
    title: 'Chasis',
    fields: {
      suspension_delantera: 'Suspensión Delantera',
      suspension_trasera: 'Suspensión Trasera',
      frenos_delantero: 'Frenos Delantero',
      frenos_trasero: 'Frenos Trasero',
      cauchos_delantero: 'Cauchos Delantero',
      cauchos_trasero: 'Cauchos Trasero',
      capacidad_combustible: 'Capacidad de Combustible',
      color: 'Colores Disponibles'
    }
  },
  electrico: {
    title: 'Sistema Eléctrico',
    fields: {
      encendido: 'Sistema de Encendido',
      bujias: 'Bujías',
      faro: 'Faro',
      luz_freno: 'Luz de Freno',
      luces_cruce: 'Luces de Cruce'
    }
  },
  dimension: {
    title: 'Dimensiones',
    fields: {
      tamano_caja: 'Tamaño de Caja',
      longitud: 'Longitud',
      ancho: 'Ancho',
      altura: 'Altura',
      distancia_ejes: 'Distancia entre Ejes',
      capacidad_carga: 'Capacidad de Carga',
      peso: 'Peso en Seco'
    }
  },
  garantia: {
    title: 'Garantía',
    fields: {
      tiempo: 'Tiempo de Garantía'
    }
  }
}
