import { supabase } from './supabase'
import { useAuthStore } from './store'

// Returns empresa_id from the Zustand store (fast) or falls back to a DB lookup.
// Also hydrates the store on cache miss so subsequent calls are instant.
export async function getEmpresaId() {
  const { empresa } = useAuthStore.getState()
  if (empresa?.id) return empresa.id

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: util } = await supabase
    .from('utilizadores')
    .select('empresa_id')
    .eq('id', session.user.id)
    .single()

  if (!util?.empresa_id) return null

  const { data: emp } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', util.empresa_id)
    .single()

  if (emp) useAuthStore.getState().setEmpresa(emp)
  return util.empresa_id
}
