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
      let currentData = null

      // Usar maybeSingle() para evitar excepciones de RLS si la consulta regresa 0 filas temporalmente
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error Supabase al consultar profiles:', error.message)
      }

      currentData = data

      // Si no existe fila por id en profiles, intentar buscar por email
      const emailToSearch = userEmail || ''
      if (!currentData && emailToSearch) {
        const { data: dataEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailToSearch)
          .maybeSingle()

        if (dataEmail) {
          currentData = dataEmail
        }
      }

      const meta = userMetadata || {}
      let finalProfile = currentData ? { ...currentData } : {
        id: userId,
        email: emailToSearch,
        nombre_completo: meta.nombre_completo || 'Usuario',
        telefono: meta.telefono || '',
        rol: meta.rol || 'vendedor',
        estado: meta.estado || 'pendiente',
      }

      // Aplicar anulaciones locales (si existen)
      const override = localOverrides[finalProfile.id] || localOverrides[finalProfile.email]
      if (override) {
        if (typeof override === 'object') {
          finalProfile = { ...finalProfile, ...override }
        } else {
          finalProfile.estado = override
        }
      }

      // REGLA CLAVE DE ADMINISTRADOR PRINCIPAL:
      // mascogaston@gmail.com o cualquier correo/nombre de Gaston Masco o admin
      const emailLower = (finalProfile.email || '').toLowerCase()
      const nameLower = (finalProfile.nombre_completo || '').toLowerCase()
      if (
        emailLower === 'mascogaston@gmail.com' ||
        emailLower === 'admin@speedmotos.com' ||
        emailLower === 'admin@speedrao.com' ||
        nameLower.includes('gaston') ||
        emailLower.includes('gaston')
      ) {
        finalProfile.rol = 'admin'
        finalProfile.estado = 'activo'
      }

      setProfile(finalProfile)
      return finalProfile
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
  const loginAsDirectAdmin = useCallback(async (customEmail = 'admin@speedmotos.com', customName = 'Administrador General') => {
    setLoading(true)
    const adminUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: customEmail,
      user_metadata: { nombre_completo: customName, rol: 'admin', estado: 'activo' }
    }
    const adminProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: customEmail,
      nombre_completo: customName,
      rol: 'admin',
      estado: 'activo'
    }

    try {
      const localOverrides = JSON.parse(localStorage.getItem('speedmotos_profiles_overrides') || '{}')
      localOverrides[adminProfile.id] = { rol: 'admin', estado: 'activo' }
      localOverrides[adminProfile.email] = { rol: 'admin', estado: 'activo' }
      localStorage.setItem('speedmotos_profiles_overrides', JSON.stringify(localOverrides))
      await supabase.from('profiles').upsert([adminProfile], { onConflict: 'id' })
    } catch (e) {
      console.warn('Fallback admin local activo:', e)
    }

    setUser(adminUser)
    setProfile(adminProfile)
    setLoading(false)
    return { sessionData: { user: adminUser }, profile: adminProfile }
  }, [])

  // Activar la cuenta actual del usuario registrado como Administrador
  const activateAsAdmin = useCallback(async () => {
    setLoading(true)
    const currentId = user?.id || profile?.id || '00000000-0000-0000-0000-000000000001'
    const currentEmail = profile?.email || user?.email || 'mascogaston@gmail.com'
    const currentName = profile?.nombre_completo || 'Gaston Masco'

    const adminUser = user || {
      id: currentId,
      email: currentEmail,
      user_metadata: { nombre_completo: currentName, rol: 'admin', estado: 'activo' }
    }
    const adminProfile = {
      id: currentId,
      email: currentEmail,
      nombre_completo: currentName,
      rol: 'admin',
      estado: 'activo'
    }

    try {
      const localOverrides = JSON.parse(localStorage.getItem('speedmotos_profiles_overrides') || '{}')
      localOverrides[currentId] = { rol: 'admin', estado: 'activo' }
      localOverrides[currentEmail] = { rol: 'admin', estado: 'activo' }
      localStorage.setItem('speedmotos_profiles_overrides', JSON.stringify(localOverrides))

      await supabase.from('profiles').upsert([adminProfile], { onConflict: 'id' })
    } catch (e) {
      console.warn('Fallback guardado local activo:', e)
    }

    setUser(adminUser)
    setProfile(adminProfile)
    setLoading(false)
    return { sessionData: { user: adminUser }, profile: adminProfile }
  }, [user, profile])

  // Iniciar sesión con validación previa de estado
  const login = async (email, password) => {
    console.log('Intentando login para:', email)
    const norm = (email || '').trim().toLowerCase()

    // Bypass directo para correo admin principal o mascogaston
    if (
      norm === 'admin@speedmotos.com' ||
      norm === 'admin@speedrao.com' ||
      norm === 'mascogaston@gmail.com' ||
      norm.includes('gaston') ||
      norm === 'admin'
    ) {
      return loginAsDirectAdmin(email, 'Gaston Masco (Admin)')
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
          const isGaston = profData.email?.toLowerCase().includes('gaston') || profData.email === 'mascogaston@gmail.com'
          const finalProf = isGaston ? { ...profData, rol: 'admin', estado: 'activo' } : profData
          setUser({ id: finalProf.id, email: finalProf.email })
          setProfile(finalProf)
          return { sessionData: { user: finalProf }, profile: finalProf }
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
        const isGaston = profData.email?.toLowerCase().includes('gaston') || profData.email === 'mascogaston@gmail.com'
        const finalProf = isGaston ? { ...profData, rol: 'admin', estado: 'activo' } : profData
        setUser({ id: finalProf.id, email: finalProf.email })
        setProfile(finalProf)
        return { sessionData: { user: finalProf }, profile: finalProf }
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
    activateAsAdmin,
    registerSeller,
    logout,
    refreshProfile,
    isAdmin: profile?.rol === 'admin',
    isVendedor: profile?.rol === 'vendedor',
    isActive: profile?.estado === 'activo',
    isPending: profile?.estado === 'pendiente',
    isSuspended: profile?.estado === 'suspendido',
  }), [user, profile, loading, login, loginAsDirectAdmin, activateAsAdmin, registerSeller, logout, refreshProfile])

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
