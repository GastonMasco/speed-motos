import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../config/supabase'

export const useUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Error al cargar lista de vendedores:', error.message)
        setUsers([])
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      console.error('Excepción al cargar usuarios:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const updateUserStatus = async (userId, newStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId)

    if (error) throw error
    await fetchUsers()
  }

  return {
    users,
    loading,
    refreshUsers: fetchUsers,
    updateUserStatus,
  }
}
