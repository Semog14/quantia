import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Copy, Trash2, Edit3, TrendingUp, Clock, CheckCircle, Search, Filter } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { EstadoBadge } from '../components/ui/Badge'
import { ConfirmModal } from '../components/ui/Modal'
import { useOrcamentos } from '../hooks/useOrcamento'
import { formatarMoeda } from '../lib/validacoes'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'
import { gerarNumeroOrcamento } from '../lib/validacoes'

const ESTADOS = ['', 'rascunho', 'enviado', 'aprovado', 'recusado', 'expirado']

export default function Dashboard() {
  const navigate = useNavigate()
  const { empresa } = useAuthStore()
  const { orcamentos, loading, refetch } = useOrcamentos()
  const [pesquisa, setPesquisa] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const mesAtual = new Date().toISOString().slice(0, 7)

  // Dashboard stats
  const stats = useMemo(() => {
    const doMes = orcamentos.filter(o => o.created_at?.slice(0, 7) === mesAtual)
    const aprovados = orcamentos.filter(o => o.estado === 'aprovado')
    const pendentes = orcamentos.filter(o => o.estado === 'enviado')
    return {
      totalMes: doMes.length,
      valorMes: doMes.reduce((a, o) => a + (o.total_com_iva || 0), 0),
      aprovadosCount: aprovados.length,
      aprovadosValor: aprovados.reduce((a, o) => a + (o.total_com_iva || 0), 0),
      pendentesCount: pendentes.length,
    }
  }, [orcamentos, mesAtual])

  // Filtered list
  const filtrados = useMemo(() => {
    return orcamentos.filter(o => {
      if (filtroEstado && o.estado !== filtroEstado) return false
      if (filtroMes && !o.data_emissao?.startsWith(filtroMes)) return false
      if (pesquisa) {
        const q = pesquisa.toLowerCase()
        return o.descricao?.toLowerCase().includes(q) ||
               o.numero?.toLowerCase().includes(q) ||
               o.clientes?.nome?.toLowerCase().includes(q)
      }
      return true
    })
  }, [orcamentos, filtroEstado, filtroMes, pesquisa])

  const handleDuplicar = async (orc) => {
    if (!empresa) return
    const ano = new Date().getFullYear()
    const { data: count } = await supabase.from('orcamentos').select('id', { count: 'exact' }).eq('empresa_id', empresa.id)
    const seq = (count?.length || 0) + 1

    const { data: novoOrc } = await supabase.from('orcamentos').insert({
      empresa_id: empresa.id,
      numero: gerarNumeroOrcamento(seq, ano),
      descricao: orc.descricao + ' (cópia)',
      cliente_id: orc.cliente_id,
      data_emissao: new Date().toISOString().split('T')[0],
      data_validade: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0],
      estado: 'rascunho',
      pct_imprevistos: orc.pct_imprevistos,
      pct_margem: orc.pct_margem,
      tipo_iva: orc.tipo_iva,
      mostrar_margem: orc.mostrar_margem,
      observacoes: orc.observacoes,
      subtotal: orc.subtotal,
      total_com_iva: orc.total_com_iva,
    }).select().single()

    if (novoOrc) {
      // Copy chapters and articles
      const { data: caps } = await supabase.from('capitulos').select('*, artigos_orcamento(*)').eq('orcamento_id', orc.id).order('ordem')
      for (const cap of caps || []) {
        const { data: novoCap } = await supabase.from('capitulos').insert({
          orcamento_id: novoOrc.id, nome: cap.nome, ordem: cap.ordem
        }).select().single()
        for (const art of cap.artigos_orcamento || []) {
          await supabase.from('artigos_orcamento').insert({
            capitulo_id: novoCap.id, orcamento_id: novoOrc.id,
            descricao: art.descricao, unidade: art.unidade,
            quantidade: art.quantidade, preco_unitario: art.preco_unitario, ordem: art.ordem,
          })
        }
      }
      refetch()
      navigate(`/orcamentos/${novoOrc.id}`)
    }
  }

  const handleEliminar = async () => {
    if (!deleteId) return
    await supabase.from('orcamentos').delete().eq('id', deleteId)
    setDeleteId(null)
    refetch()
  }

  const mesesDisponiveis = useMemo(() => {
    const meses = [...new Set(orcamentos.map(o => o.data_emissao?.slice(0, 7)).filter(Boolean))].sort().reverse()
    return meses
  }, [orcamentos])

  return (
    <AppLayout title="Início">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Painel</h1>
            <p className="text-sm text-gray-500 mt-0.5">Bem-vindo ao Quantia</p>
          </div>
          <button
            onClick={() => navigate('/orcamentos/novo')}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Novo Orçamento</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={<FileText size={20} />} label="Orçamentos este mês" value={stats.totalMes} color="blue" />
          <StatCard icon={<TrendingUp size={20} />} label="Valor proposto" value={formatarMoeda(stats.valorMes)} color="orange" />
          <StatCard icon={<CheckCircle size={20} />} label="Aprovados" value={`${stats.aprovadosCount} · ${formatarMoeda(stats.aprovadosValor)}`} color="green" small />
          <StatCard icon={<Clock size={20} />} label="Pendentes" value={stats.pendentesCount} color="yellow" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-border p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={pesquisa}
                onChange={e => setPesquisa(e.target.value)}
                placeholder="Pesquisar por obra, cliente ou número..."
                className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            >
              <option value="">Todos os estados</option>
              {ESTADOS.slice(1).map(e => (
                <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
              ))}
            </select>
            <select
              value={filtroMes}
              onChange={e => setFiltroMes(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            >
              <option value="">Todos os meses</option>
              {mesesDisponiveis.map(m => (
                <option key={m} value={m}>{formatarMes(m)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">A carregar...</div>
          ) : filtrados.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm">
                {orcamentos.length === 0 ? 'Ainda não tem orçamentos. Crie o primeiro!' : 'Nenhum resultado encontrado.'}
              </p>
              {orcamentos.length === 0 && (
                <button
                  onClick={() => navigate('/orcamentos/novo')}
                  className="mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Criar primeiro orçamento
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Número</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Obra</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Cliente</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Data</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Total c/ IVA</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtrados.map(orc => (
                    <tr key={orc.id} className="hover:bg-bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{orc.numero}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{orc.descricao}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {orc.clientes?.nome || <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell whitespace-nowrap">
                        {orc.data_emissao ? new Date(orc.data_emissao).toLocaleDateString('pt-PT') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatarMoeda(orc.total_com_iva)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <EstadoBadge estado={orc.estado} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => navigate(`/orcamentos/${orc.id}`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Editar"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDuplicar(orc)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Duplicar"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(orc.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleEliminar}
        title="Eliminar orçamento"
        message="Tem a certeza que deseja eliminar este orçamento? Esta ação não pode ser revertida."
        confirmLabel="Eliminar"
        danger
      />
    </AppLayout>
  )
}

function StatCard({ icon, label, value, color, small }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-primary',
    green: 'bg-green-50 text-success',
    yellow: 'bg-yellow-50 text-yellow-700',
  }
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold text-gray-900 ${small ? 'text-sm' : 'text-lg'}`}>{value}</p>
    </div>
  )
}

function formatarMes(mesAno) {
  const [ano, mes] = mesAno.split('-')
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[parseInt(mes) - 1]} ${ano}`
}
