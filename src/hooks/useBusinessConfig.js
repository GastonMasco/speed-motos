import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../config/supabase'

export const DEFAULT_CONFIG = {
  id: 1,
  nombre_negocio: 'Speed Rao Motos',
  eslogan: 'Venta de Repuestos, Accesorios y Taller Especializado',
  direccion: 'La Paz, Bolivia',
  telefono: '+591 71234567',
  nit: '1028374029',
  markup_global_defecto: 40.0,
  markup_por_categoria: {
    frenos: 35,
    llantas: 25,
    plasticos: 45,
    transmision: 30,
    filtros: 35,
    lubricantes: 25,
    electricidad: 40,
    motor: 30,
    varios: 40,
  },
  descuento_maximo_vendedor: 15.0,
}

export const useBusinessConfig = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('configuracion_negocio')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (!error && data) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...data,
          markup_por_categoria: data.markup_por_categoria || DEFAULT_CONFIG.markup_por_categoria,
        })
      } else {
        setConfig(DEFAULT_CONFIG)
      }
    } catch (err) {
      console.error('Error al cargar configuración de negocio:', err)
      setConfig(DEFAULT_CONFIG)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const updateConfig = async (newFields) => {
    setLoading(true)
    try {
      const payload = {
        id: 1,
        ...config,
        ...newFields,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('configuracion_negocio')
        .upsert([payload])
        .select()
        .single()

      if (error) throw error

      setConfig({
        ...DEFAULT_CONFIG,
        ...data,
      })
      return data
    } catch (err) {
      console.error('Error guardando configuración:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    config,
    loading,
    refreshConfig: fetchConfig,
    updateConfig,
  }
}
