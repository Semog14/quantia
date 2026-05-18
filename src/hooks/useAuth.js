import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'

export function useAuthInit() {
  const { setUser, setEmpresa, setLoading } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // Never stay loading more than 8s
    const timeout = setTimeout(() => { if (mounted) setLoading(false) }, 8000)

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (session?.user) {
          setUser(session.user)
          await loadEmpresa(session.user.id, setEmpresa)
        }
      } catch (e) {
        console.error('Auth init error:', e)
      } finally {
        clearTimeout(timeout)
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      // Only handle explicit sign-in/out events, not INITIAL_SESSION (handled by initAuth)
      if (event === 'SIGNED_IN') {
        try {
          setUser(session.user)
          await loadEmpresa(session.user.id, setEmpresa)
        } catch (e) {
          console.error('Auth state change error:', e)
        } finally {
          if (mounted) setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setEmpresa(null)
        if (mounted) setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])
}

// Two separate queries to avoid RLS join issues
async function loadEmpresa(userId, setEmpresa) {
  try {
    const { data: util, error: e1 } = await supabase
      .from('utilizadores')
      .select('empresa_id')
      .eq('id', userId)
      .single()

    if (e1 || !util?.empresa_id) {
      console.warn('Utilizador sem empresa associada:', e1?.message)
      return
    }

    const { data: emp, error: e2 } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', util.empresa_id)
      .single()

    if (e2) { console.warn('Erro ao carregar empresa:', e2.message); return }
    if (emp) setEmpresa(emp)
  } catch (e) {
    console.error('loadEmpresa error:', e)
  }
}
