import { create } from 'zustand'
import { supabase } from './supabase'

export const useAuthStore = create((set) => ({
  user: null,
  empresa: null,
  loading: true,
  setUser: (user) => set({ user }),
  setEmpresa: (empresa) => set({ empresa }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, empresa: null })
  },
}))

export const useOrcamentoStore = create((set, get) => ({
  capitulos: [],
  setCapitulos: (capitulos) => set({ capitulos }),
  addCapitulo: (capitulo) => set(s => ({ capitulos: [...s.capitulos, capitulo] })),
  updateCapitulo: (id, changes) => set(s => ({
    capitulos: s.capitulos.map(c => c.id === id ? { ...c, ...changes } : c),
  })),
  removeCapitulo: (id) => set(s => ({
    capitulos: s.capitulos.filter(c => c.id !== id),
  })),
  moveCapitulo: (id, dir) => set(s => {
    const caps = [...s.capitulos]
    const idx = caps.findIndex(c => c.id === id)
    if (dir === 'up' && idx > 0) [caps[idx - 1], caps[idx]] = [caps[idx], caps[idx - 1]]
    if (dir === 'down' && idx < caps.length - 1) [caps[idx], caps[idx + 1]] = [caps[idx + 1], caps[idx]]
    return { capitulos: caps }
  }),
  addArtigo: (capituloId, artigo) => set(s => ({
    capitulos: s.capitulos.map(c =>
      c.id === capituloId ? { ...c, artigos: [...(c.artigos || []), artigo] } : c
    ),
  })),
  updateArtigo: (capituloId, artigoId, changes) => set(s => ({
    capitulos: s.capitulos.map(c =>
      c.id === capituloId
        ? { ...c, artigos: (c.artigos || []).map(a => a.id === artigoId ? { ...a, ...changes } : a) }
        : c
    ),
  })),
  removeArtigo: (capituloId, artigoId) => set(s => ({
    capitulos: s.capitulos.map(c =>
      c.id === capituloId
        ? { ...c, artigos: (c.artigos || []).filter(a => a.id !== artigoId) }
        : c
    ),
  })),
  moveArtigo: (capituloId, artigoId, dir) => set(s => ({
    capitulos: s.capitulos.map(c => {
      if (c.id !== capituloId) return c
      const arts = [...(c.artigos || [])]
      const idx = arts.findIndex(a => a.id === artigoId)
      if (dir === 'up' && idx > 0) [arts[idx - 1], arts[idx]] = [arts[idx], arts[idx - 1]]
      if (dir === 'down' && idx < arts.length - 1) [arts[idx], arts[idx + 1]] = [arts[idx + 1], arts[idx]]
      return { ...c, artigos: arts }
    }),
  })),
}))
