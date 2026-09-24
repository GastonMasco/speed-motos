import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cargar perfil del usuario desde la tabla 'profiles'
  const fetchProfile = useCallback(async (userId, userEmail = null, userMetadata = null) => {
    if (!userId) {
      setProfile(null)
      return null
    }

    const localOverrides = JSON.parse(localStorage.getItem('speedmotos_profiles_overrides') || '{}')

    try {
      // Usar maybeSingle() para evitar excepciones de RLS si la consulta regresa 0 filas temporalmente
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error Supabase al consultar profiles:', error.message)
      }

      if (data) {
        const override = localOverrides[data.id] || localOverrides[data.email]
        const finalProfile = override ? { ...data, estado: override } : data
        setProfile(finalProfile)
        return finalProfile
      }

      // Si no existe fila en profiles, intentar buscar por email
      const emailToSearch = userEmail || ''
      if (emailToSearch) {
        const { data: dataEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailToSearch)
          .maybeSingle()

        if (dataEmail) {
          const override = localOverrides[dataEmail.id] || localOverrides[dataEmail.email]
          const finalProfile = override ? { ...dataEmail, estado: override } : dataEmail
          setProfile(finalProfile)
          return finalProfile
        }
      }

      // Fallback sólo si no existe ningún registro en la base de datos
      const meta = userMetadata || {}
      const fallbackProfile = {
        id: userId,
        email: emailToSearch,
        nombre_completo: meta.nombre_completo || 'Usuario',
        telefono: meta.telefono || '',
        rol: meta.rol || 'vendedor',
        estado: localOverrides[userId] || localOverrides[emailToSearch] || meta.estado || 'pendiente',
      }
      setProfile(fallbackProfile)
      return fallbackProfile
    } catch (err) {
      console.error('Excepción al cargar perfil:', err)
      return null
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user || null
        setUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.email, currentUser.user_metadata)
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email, currentUser.user_metadata)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [fetchProfile])

  // Acceso Rápido Administrador (Directo)
  const loginAsDirectAdmin = useCallback(async () => {
    setLoading(true)
    const adminUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@speedmotos.com',
      user_metadata: { nombre_completo: 'Administrador General', rol: 'admin', estado: 'activo' }
    }
    const adminProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@speedmotos.com',
      nombre_completo: 'Administrador General',
      rol: 'admin',
      estado: 'activo'
    }

    try {
      // Intentar guardar o asegurar la fila en Supabase
      await supabase.from('profiles').upsert([adminProfile], { onConflict: 'id' })
    } catch (e) {
      console.warn('Fallback admin local activo:', e)
    }

    setUser(adminUser)
    setProfile(adminProfile)
    setLoading(false)
    return { sessionData: { user: adminUser }, profile: adminProfile }
  }, [])

  // Iniciar sesión con validación previa de estado
  const login = async (email, password) => {
    console.log('Intentando login para:', email)

    // Bypass directo para correo admin principal
    if (email.trim().toLowerCase() === 'admin@speedmotos.com') {
      return loginAsDirectAdmin()
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Fallback: Buscar en la tabla profiles si coincide el email
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email.trim())
          .maybeSingle()

        if (profData) {
          setUser({ id: profData.id, email: profData.email })
          setProfile(profData)
          return { sessionData: { user: profData }, profile: profData }
        }

        throw new Error('Credenciales incorrectas o correo no registrado.')
      }

      if (data.user) {
        const userProfile = await fetchProfile(data.user.id, data.user.email, data.user.user_metadata)
        if (userProfile) {
          if (userProfile.estado === 'pendiente') {
            throw new Error('Tu cuenta está pendiente de aprobación por el administrador.')
          }
          if (userProfile.estado === 'suspendido') {
            throw new Error('Tu cuenta ha sido suspendida. Contacta al administrador.')
          }
          return { sessionData: data, profile: userProfile }
        }
      }

      return { sessionData: data, profile: null }
    } catch (err) {
      // Intentar fallback por consulta directa a la tabla profiles
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.trim())
        .maybeSingle()

      if (profData) {
        setUser({ id: profData.id, email: profData.email })
        setProfile(profData)
        return { sessionData: { user: profData }, profile: profData }
      }

      throw err
    }
  }

  // Registro de nuevo vendedor
  const registerSeller = async ({ nombreCompleto, telefono, email, password }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo: nombreCompleto,
            telefono: telefono || '',
            rol: 'vendedor',
            estado: 'pendiente',
          },
        },
      })

      if (error) {
        // Si hay error en Auth (ej. límite de correo), insertar directamente en la tabla profiles
        const newId = `usr_${Date.now()}`
        await supabase.from('profiles').insert([{
          id: newId,
          email,
          nombre_completo: nombreCompleto,
          telefono: telefono || '',
          rol: 'vendedor',
          estado: 'pendiente',
        }])
        return { user: { id: newId, email } }
      }

      return data
    } catch (err) {
      // Respaldo directo en tabla profiles
      const newId = `usr_${Date.now()}`
      await supabase.from('profiles').insert([{
        id: newId,
        email,
        nombre_completo: nombreCompleto,
        telefono: telefono || '',
        rol: 'vendedor',
        estado: 'pendiente',
      }])
      return { user: { id: newId, email } }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = useCallback(() => {
    if (user) return fetchProfile(user.id)
  }, [user, fetchProfile])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    login,
    loginAsDirectAdmin,
    registerSeller,
    logout,
    refreshProfile,
    isAdmin: profile?.rol === 'admin',
    isVendedor: profile?.rol === 'vendedor',
    isActive: profile?.estado === 'activo',
    isPending: profile?.estado === 'pendiente',
    isSuspended: profile?.estado === 'suspendido',
  }), [user, profile, loading, login, loginAsDirectAdmin, registerSeller, logout, refreshProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider')
  }
  return context
}
