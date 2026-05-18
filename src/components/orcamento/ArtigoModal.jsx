import React, { useState, useMemo } from 'react'
import { Search, Plus, X } from 'lucide-react'
import Modal from '../ui/Modal'
import artigosBD, { UNIDADES } from '../../data/artigosBD'
import { formatarMoeda } from '../../lib/validacoes'

export default function ArtigoModal({ open, onClose, onAdd }) {
  const [pesquisa, setPesquisa] = useState('')
  const [capituloFiltro, setCapituloFiltro] = useState('')
  const [custom, setCustom] = useState(false)
  const [form, setForm] = useState({ descricao: '', unidade: 'm²', quantidade: 1, preco_unitario: 0 })

  const capitulos = useMemo(() => [...new Set(artigosBD.map(a => a.capitulo))], [])

  const filtrados = useMemo(() => {
    return artigosBD.filter(a => {
      if (capituloFiltro && a.capitulo !== capituloFiltro) return false
      if (pesquisa) return a.descricao.toLowerCase().includes(pesquisa.toLowerCase())
      return true
    }).slice(0, 50)
  }, [pesquisa, capituloFiltro])

  const handleSelectArtigo = (artigo) => {
    setForm({
      descricao: artigo.descricao,
      unidade: artigo.unidade,
      quantidade: 1,
      preco_unitario: artigo.preco_sugerido || artigo.preco_min || 0,
    })
    setCustom(true)
  }

  const handleAdd = () => {
    if (!form.descricao) return
    onAdd({
      id: 'local-' + Date.now(),
      descricao: form.descricao,
      unidade: form.unidade,
      quantidade: parseFloat(form.quantidade) || 1,
      preco_unitario: parseFloat(form.preco_unitario) || 0,
    })
    setPesquisa('')
    setCapituloFiltro('')
    setCustom(false)
    setForm({ descricao: '', unidade: 'm²', quantidade: 1, preco_unitario: 0 })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar Artigo" size="lg">
      {!custom ? (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={pesquisa}
              onChange={e => setPesquisa(e.target.value)}
              placeholder="Pesquisar artigo..."
              className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
          </div>

          {/* Category filter */}
          <select
            value={capituloFiltro}
            onChange={e => setCapituloFiltro(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            <option value="">Todos os capítulos</option>
            {capitulos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Articles list */}
          <div className="max-h-72 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {filtrados.map(a => (
              <button
                key={a.id}
                onClick={() => handleSelectArtigo(a)}
                className="w-full text-left px-4 py-3 hover:bg-bg-secondary transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.descricao}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.capitulo} · {a.unidade}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {a.preco_sugerido > 0 ? (
                      <p className="text-sm font-semibold text-primary">{formatarMoeda(a.preco_sugerido)}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Preço livre</p>
                    )}
                    {a.preco_min > 0 && a.preco_max > 0 && (
                      <p className="text-xs text-gray-400">{formatarMoeda(a.preco_min)} – {formatarMoeda(a.preco_max)}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {filtrados.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">Nenhum artigo encontrado</div>
            )}
          </div>

          {/* Custom article */}
          <button
            onClick={() => setCustom(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-border rounded-lg text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={16} />
            Criar artigo personalizado
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setCustom(false)} className="p-1.5 rounded-lg hover:bg-bg-secondary text-gray-500">
              <X size={16} />
            </button>
            <h3 className="text-sm font-medium text-gray-700">Configurar artigo</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <input
              type="text"
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Descrição do trabalho..."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <select
                value={form.unidade}
                onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
              >
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <input
                type="number"
                min="0" step="0.01"
                value={form.quantidade}
                onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">P. Unitário (€)</label>
              <input
                type="number"
                min="0" step="0.01"
                value={form.preco_unitario}
                onChange={e => setForm(f => ({ ...f, preco_unitario: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">
              Total: <span className="font-semibold text-gray-900">
                {formatarMoeda((parseFloat(form.quantidade) || 0) * (parseFloat(form.preco_unitario) || 0))}
              </span>
            </p>
            <button
              onClick={handleAdd}
              disabled={!form.descricao}
              className="bg-primary text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
