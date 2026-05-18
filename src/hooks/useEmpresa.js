import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'

export function useEmpresa() {
  const [saving, setSaving] = useState(false)
  const { empresa, setEmpresa } = useAuthStore()

  const saveEmpresa = async (data) => {
    if (!empresa) return
    setSaving(true)
    const { data: updated } = await supabase
      .from('empresas')
      .update(data)
      .eq('id', empresa.id)
      .select()
      .single()
    if (updated) setEmpresa(updated)
    setSaving(false)
    return updated
  }

  const uploadLogo = async (file) => {
    if (!empresa || !file) return null
    const ext = file.name.split('.').pop()
    const path = `logos/${empresa.id}.${ext}`
    await supabase.storage.from('empresas').upload(path, file, { upsert: true })
    const { data } = supabase.storage.from('empresas').getPublicUrl(path)
    return data.publicUrl
  }

  return { empresa, saving, saveEmpresa, uploadLogo }
}
