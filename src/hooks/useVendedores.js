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

      const localOverrides = JSON.parse(localStorage.getItem('speedmotos_profiles_overrides') || '{}')

      let list = data || []
      if (error) {
        console.warn('Error al obtener lista de vendedores desde Supabase:', error.message)
      }

      // Combinar con anulaciones locales almacenadas
      const merged = list.map(v => {
        const override = localOverrides[v.id] || localOverrides[v.email]
        return override ? { ...v, estado: override } : v
      })

      // Ordenar destacando los "pendientes" en primer lugar
      const sorted = merged.sort((a, b) => {
        if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1
        if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1
        return new Date(b.created_at) - new Date(a.created_at)
      })
      setVendedores(sorted)
    } catch (err) {
      console.error('Excepción al cargar vendedores:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendedores()
  }, [fetchVendedores])

  // Cambiar estado con actualización optimista y soporte para Acceso Directo Admin
  const cambiarEstado = async (userId, nuevoEstado) => {
    let targetEmail = null

    // 1. Actualización optimista en React UI
    setVendedores(prev =>
      prev.map(v => {
        if (v.id === userId || v.email === userId) {
          targetEmail = v.email
          return { ...v, estado: nuevoEstado }
        }
        return v
      })
    )

    // 2. Persistir en localStorage para mantener consistencia local inmediata
    try {
      const localOverrides = JSON.parse(localStorage.getItem('speedmotos_profiles_overrides') || '{}')
      localOverrides[userId] = nuevoEstado
      if (targetEmail) localOverrides[targetEmail] = nuevoEstado
      localStorage.setItem('speedmotos_profiles_overrides', JSON.stringify(localOverrides))
    } catch (e) {
      console.warn('No se pudo guardar override en localStorage:', e)
    }

    // 3. Persistir en Supabase (por ID y por Email como respaldo)
    try {
      let { error } = await supabase
        .from('profiles')
        .update({ estado: nuevoEstado })
        .eq('id', userId)

      if (error && targetEmail) {
        const resEmail = await supabase
          .from('profiles')
          .update({ estado: nuevoEstado })
          .eq('email', targetEmail)
        error = resEmail.error
      }

      if (error) {
        console.warn('Nota de Supabase al actualizar perfil (guardado local activo):', error.message)
      }
    } catch (err) {
      console.warn('Excepción al actualizar en Supabase (guardado local activo):', err)
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

