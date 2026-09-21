import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useVendedores = () => {
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchVendedores = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Error al obtener lista de vendedores:', error.message)
        setVendedores([])
      } else {
        // Ordenar destacando los "pendientes" en primer lugar
        const sorted = (data || []).sort((a, b) => {
          if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1
          if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1
          return new Date(b.created_at) - new Date(a.created_at)
        })
        setVendedores(sorted)
      }
    } catch (err) {
      console.error('Excepción al cargar vendedores:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendedores()
  }, [fetchVendedores])

  // Cambiar estado con actualización optimista (Instantánea en la UI)
  const cambiarEstado = async (userId, nuevoEstado) => {
    // 1. Actualización optimista local en el estado React (Respuesta en 0 ms)
    setVendedores(prev =>
      prev.map(v => (v.id === userId ? { ...v, estado: nuevoEstado } : v))
    )

    // 2. Persistir en la base de datos de Supabase en segundo plano
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ estado: nuevoEstado })
        .eq('id', userId)

      if (error) {
        console.error('Error al actualizar perfil en Supabase:', error.message)
        await fetchVendedores() // Revertir a la base de datos si falla
        throw error
      }
    } catch (err) {
      await fetchVendedores()
      throw err
    }
  }

  const rechazarVendedor = async (userId) => {
    return cambiarEstado(userId, 'suspendido')
  }

  return {
    vendedores,
    loading,
    refreshVendedores: fetchVendedores,
    aprobarVendedor: (id) => cambiarEstado(id, 'activo'),
    suspenderVendedor: (id) => cambiarEstado(id, 'suspendido'),
    reactivarVendedor: (id) => cambiarEstado(id, 'activo'),
    rechazarVendedor,
  }
}
