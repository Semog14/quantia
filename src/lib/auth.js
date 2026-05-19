import { supabase } from './supabase'
import { useAuthStore } from './store'

// Returns empresa_id from the Zustand store (fast) or falls back to a DB lookup.
// Also hydrates the store on cache miss so subsequent calls are instant.
export async function getEmpresaId() {
  try {
    const { empresa } = useAuthStore.getState()
    if (empresa?.id) return empresa.id

    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError || !authData?.session?.user) return null
    const userId = authData.session.user.id

    const { data: util, error: utilError } = await supabase
      .from('utilizadores')
      .select('empresa_id')
      .eq('id', userId)
      .single()

    if (utilError || !util?.empresa_id) {
      console.warn('getEmpresaId: utilizador sem empresa', utilError?.message)
      return null
    }

    const { data: emp } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', util.empresa_id)
      .single()

    if (emp) useAuthStore.getState().setEmpresa(emp)
    return util.empresa_id
  } catch (e) {
    console.error('getEmpresaId erro:', e)
    return null
  }
}
