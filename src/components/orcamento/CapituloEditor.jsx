import React, { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Edit2, Check, X } from 'lucide-react'
import ArtigoModal from './ArtigoModal'
import { formatarMoeda } from '../../lib/validacoes'
import { calcularSubtotalCapitulo } from '../../lib/calculos'
import { UNIDADES } from '../../data/artigosBD'
import { ConfirmModal } from '../ui/Modal'

// Callbacks receive (capId, ...) — capId is always capitulo.id
function CapituloEditor({ capitulo, index, total, onUpdate, onRemove, onMoveUp, onMoveDown, onAddArtigo, onUpdateArtigo, onRemoveArtigo }) {
  const [artigoModal, setArtigoModal] = useState(false)
  const [editNome, setEditNome] = useState(false)
  const [nomeTemp, setNomeTemp] = useState(capitulo.nome)
  const [deleteArtigoId, setDeleteArtigoId] = useState(null)
  const capId = capitulo.id
  const subtotal = calcularSubtotalCapitulo(capitulo.artigos)

  const handleSaveNome = () => {
    if (nomeTemp.trim()) onUpdate(capId, { nome: nomeTemp.trim() })
    setEditNome(false)
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden mb-3">
      {/* Chapter header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-border">
        <GripVertical size={16} className="text-gray-300 drag-handle shrink-0" />
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onMoveUp(capId, 'up')}
            disabled={index === 0}
            className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => onMoveDown(capId, 'down')}
            disabled={index === total - 1}
            className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {editNome ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={nomeTemp}
              onChange={e => setNomeTemp(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveNome(); if (e.key === 'Escape') setEditNome(false) }}
              className="flex-1 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-semibold"
              autoFocus
            />
            <button onClick={handleSaveNome} className="p-1 text-success hover:text-green-700"><Check size={14} /></button>
            <button onClick={() => setEditNome(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>
        ) : (
          <button
            onClick={() => { setNomeTemp(capitulo.nome); setEditNome(true) }}
            className="flex-1 text-left text-sm font-semibold text-gray-800 hover:text-primary transition-colors group flex items-center gap-1.5"
          >
            <span className="text-gray-400 text-xs font-mono">{String(index + 1).padStart(2, '0')}</span>
            {capitulo.nome}
            <Edit2 size={12} className="text-gray-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold text-gray-900 hidden sm:block">{formatarMoeda(subtotal)}</span>
          <button
            onClick={() => onRemove(capId)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-danger hover:bg-red-50 transition-colors"
            title="Eliminar capítulo"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Articles */}
      <div>
        {(capitulo.artigos || []).length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 w-6">#</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Descrição</th>
                  <th className="text-center px-2 py-2 text-xs font-medium text-gray-500 w-20">Un.</th>
                  <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 w-24">Qtd.</th>
                  <th className="text-right px-2 py-2 text-xs font-medium text-gray-500 w-28">P. Unit. (€)</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 w-28">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(capitulo.artigos || []).map((art, ai) => (
                  <tr key={art.id} className="hover:bg-bg-secondary/30 group">
                    <td className="px-4 py-1.5 text-xs text-gray-400 font-mono">{String(ai + 1).padStart(2, '0')}</td>
                    <td className="px-4 py-1.5">
                      <input
                        type="text"
                        value={art.descricao}
                        onChange={e => onUpdateArtigo(capId, art.id, { descricao: e.target.value })}
                        className="w-full bg-transparent border-0 text-sm text-gray-800 focus:outline-none focus:bg-white focus:border focus:border-border rounded px-1 py-0.5 min-w-[200px]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={art.unidade}
                        onChange={e => onUpdateArtigo(capId, art.id, { unidade: e.target.value })}
                        className="w-full bg-transparent border-0 text-sm text-gray-600 text-center focus:outline-none focus:bg-white focus:border focus:border-border rounded px-1 py-0.5"
                      >
                        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min="0" step="0.01"
                        value={art.quantidade}
                        onChange={e => onUpdateArtigo(capId, art.id, { quantidade: e.target.value })}
                        className="w-full bg-transparent border-0 text-sm text-right text-gray-800 focus:outline-none focus:bg-white focus:border focus:border-border rounded px-1 py-0.5"
                        inputMode="decimal"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min="0" step="0.01"
                        value={art.preco_unitario}
                        onChange={e => onUpdateArtigo(capId, art.id, { preco_unitario: e.target.value })}
                        className="w-full bg-transparent border-0 text-sm text-right text-gray-800 focus:outline-none focus:bg-white focus:border focus:border-border rounded px-1 py-0.5"
                        inputMode="decimal"
                      />
                    </td>
                    <td className="px-4 py-1.5 text-right text-sm font-medium text-gray-900">
                      {formatarMoeda((parseFloat(art.quantidade) || 0) * (parseFloat(art.preco_unitario) || 0))}
                    </td>
                    <td className="py-1.5 pr-2">
                      <button
                        onClick={() => setDeleteArtigoId(art.id)}
                        className="p-1.5 rounded text-gray-200 hover:text-danger hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-gray-50">
                  <td colSpan={5} className="px-4 py-2 text-xs font-medium text-gray-500 text-right">Subtotal do capítulo</td>
                  <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">{formatarMoeda(subtotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="px-4 py-3">
          <button
            onClick={() => setArtigoModal(true)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium transition-colors"
          >
            <Plus size={15} />
            Adicionar artigo
          </button>
        </div>
      </div>

      <ArtigoModal
        open={artigoModal}
        onClose={() => setArtigoModal(false)}
        onAdd={(artigo) => { onAddArtigo(capId, artigo); setArtigoModal(false) }}
      />

      <ConfirmModal
        open={!!deleteArtigoId}
        onClose={() => setDeleteArtigoId(null)}
        onConfirm={() => { onRemoveArtigo(capId, deleteArtigoId); setDeleteArtigoId(null) }}
        title="Eliminar artigo"
        message="Tem a certeza que deseja eliminar este artigo?"
        confirmLabel="Eliminar"
        danger
      />
    </div>
  )
}

export default React.memo(CapituloEditor)
