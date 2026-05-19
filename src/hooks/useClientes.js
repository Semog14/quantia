import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getEmpresaId } from '../lib/auth'

export function useClientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    const empresaId = await getEmpresaId()
    if (!empresaId) { setLoading(false); return }
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome')
    setClientes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  const saveCliente = async (cliente) => {
    const empresaId = await getEmpresaId()
    if (!empresaId) throw new Error('Empresa não encontrada. Por favor, recarregue a página.')
    const payload = { ...cliente, empresa_id: empresaId }
    if (cliente.id) {
      const { data, error } = await supabase.from('clientes').update(payload).eq('id', cliente.id).select().single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase.from('clientes').insert(payload).select().single()
      if (error) throw error
      return data
    }
  }

  const deleteCliente = async (id) => {
    await supabase.from('clientes').delete().eq('id', id)
    await fetchClientes()
  }

  return { clientes, loading, saveCliente, deleteCliente, refetch: fetchClientes }
}
