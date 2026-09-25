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
        let item = { ...v }

        if (override) {
          if (typeof override === 'object') {
            item = { ...item, ...override }
          } else {
            item.estado = override
          }
        }

        // mascogaston@gmail.com es Administrador por defecto
        if (v.email === 'mascogaston@gmail.com') {
          item.rol = 'admin'
          item.estado = 'activo'
        }

        return item
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

  // Promover usuario a Administrador
  const hacerAdmin = async (userId) => {
    let targetEmail = null

    setVendedores(prev =>
      prev.map(v => {
        if (v.id === userId || v.email === userId) {
          targetEmail = v.email
          return { ...v, rol: 'admin', estado: 'activo' }
        }
        return v
      })
    )

    try {
      const localOverrides = JSON.parse(localStorage.getItem('speedmotos_profiles_overrides') || '{}')
      const overrideObj = { rol: 'admin', estado: 'activo' }
      localOverrides[userId] = overrideObj
      if (targetEmail) localOverrides[targetEmail] = overrideObj
      localStorage.setItem('speedmotos_profiles_overrides', JSON.stringify(localOverrides))
    } catch (e) {
      console.warn('No se pudo guardar override de admin en localStorage:', e)
    }

    try {
      let { error } = await supabase
        .from('profiles')
        .update({ rol: 'admin', estado: 'activo' })
        .eq('id', userId)

      if (error && targetEmail) {
        await supabase
          .from('profiles')
          .update({ rol: 'admin', estado: 'activo' })
          .eq('email', targetEmail)
      }
    } catch (err) {
      console.warn('Excepción al promover a Admin en Supabase:', err)
    }
  }

  const rechazarVendedor = async (userId) => {
    return cambiarEstado(userId, 'suspendido')
  }

  // Cambiar/Restablecer contraseña de un vendedor
  const cambiarPasswordVendedor = async (userId, userEmail, nuevaPassword) => {
    try {
      const passwordOverrides = JSON.parse(localStorage.getItem('speedmotos_password_overrides') || '{}')
      if (userEmail) passwordOverrides[userEmail.toLowerCase()] = nuevaPassword
      if (userId) passwordOverrides[userId] = nuevaPassword
      localStorage.setItem('speedmotos_password_overrides', JSON.stringify(passwordOverrides))
    } catch (e) {
      console.warn('Error al guardar override de contraseña:', e)
    }

    try {
      if (userEmail) {
        await supabase.auth.resetPasswordForEmail(userEmail)
      }
    } catch (err) {
      console.warn('Excepción al notificar reset por email:', err)
    }

    return true
  }

  return {
    vendedores,
    loading,
    refreshVendedores: fetchVendedores,
    aprobarVendedor: (id) => cambiarEstado(id, 'activo'),
    suspenderVendedor: (id) => cambiarEstado(id, 'suspendido'),
    reactivarVendedor: (id) => cambiarEstado(id, 'activo'),
    rechazarVendedor,
    hacerAdmin,
    cambiarPasswordVendedor,
  }
}

