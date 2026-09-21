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
        setProfile(data)
        return data
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
          setProfile(dataEmail)
          return dataEmail
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
        estado: meta.estado || 'pendiente',
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

  // Iniciar sesión con validación previa de estado
  const login = async (email, password) => {
    console.log('Intentando login para:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Error Supabase Auth:', error)
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Tu correo requiere confirmación. En Supabase Auth -> Settings -> Providers -> Email, desactiva "Confirm email" o confirma tu usuario en la lista de usuarios.')
      }
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Credenciales incorrectas (verifica correo y contraseña).')
      }
      throw new Error(error.message || 'Error al iniciar sesión.')
    }

    if (data.user) {
      const userProfile = await fetchProfile(data.user.id, data.user.email, data.user.user_metadata)
      console.log('Perfil tras login:', userProfile)
      
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
  }

  // Registro de nuevo vendedor
  const registerSeller = async ({ nombreCompleto, telefono, email, password }) => {
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
      if (error.message.includes('User already registered')) {
        throw new Error('Este correo electrónico ya está registrado. Por favor selecciona "Inicia sesión aquí".')
      }
      if (error.message.includes('rate limit') || error.code === 'over_email_send_rate_limit' || error.status === 429) {
        throw new Error('Supabase bloqueó el registro por límite de correos. En Supabase -> Authentication -> Providers -> Email, desactiva la casilla "Confirm email".')
      }
      throw error
    }

    return data
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
    registerSeller,
    logout,
    refreshProfile,
    isAdmin: profile?.rol === 'admin',
    isVendedor: profile?.rol === 'vendedor',
    isActive: profile?.estado === 'activo',
    isPending: profile?.estado === 'pendiente',
    isSuspended: profile?.estado === 'suspendido',
  }), [user, profile, loading, login, registerSeller, logout, refreshProfile])

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
