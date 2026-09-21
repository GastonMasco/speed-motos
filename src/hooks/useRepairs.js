import { useState, useCallback } from 'react'
import { supabase } from '../config/supabase'
import { useAuth } from '../context/AuthContext'
import { ITEMS_PER_PAGE } from '../utils/constants'

export const useRepairs = () => {
  const { profile } = useAuth()
  const [repairs, setRepairs] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchRepairs = useCallback(async (page = 1, search = '') => {
    setLoading(true)
    try {
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      let query = supabase
        .from('repairs')
        .select('*, profiles(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (search.trim()) {
        const term = `%${search.trim()}%`
        query = query.or(`client_name.ilike.${term},moto_model.ilike.${term},moto_plate.ilike.${term},issue_description.ilike.${term}`)
      }

      const { data, count, error } = await query

      if (error) {
        console.warn('Error al cargar reparaciones:', error.message)
        setRepairs([])
        setTotalCount(0)
      } else {
        setRepairs(data || [])
        setTotalCount(count || 0)
      }
    } catch (err) {
      console.error('Excepción al cargar reparaciones:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  // Crear o actualizar orden de trabajo
  const saveRepair = async (repairData) => {
    const payload = {
      seller_id: profile?.id || null,
      client_name: repairData.client_name,
      client_phone: repairData.client_phone || '',
      moto_model: repairData.moto_model || '',
      moto_plate: repairData.moto_plate || '',
      issue_description: repairData.issue_description || '',
      status: repairData.status || 'recibido',
      estimated_total_bs: Number(repairData.estimated_total_bs) || 0,
      advance_payment_bs: Number(repairData.advance_payment_bs) || 0,
    }

    if (repairData.id) {
      const { data, error } = await supabase
        .from('repairs')
        .update(payload)
        .eq('id', repairData.id)
        .select()

      if (error) throw error
      await fetchRepairs()
      return data
    } else {
      const { data, error } = await supabase
        .from('repairs')
        .insert([payload])
        .select()

      if (error) throw error
      await fetchRepairs()
      return data
    }
  }

  // Cambiar estado de la orden
  const updateRepairStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('repairs')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) throw error
    await fetchRepairs()
  }

  return {
    repairs,
    totalCount,
    loading,
    statusFilter,
    setStatusFilter,
    fetchRepairs,
    saveRepair,
    updateRepairStatus,
  }
}
