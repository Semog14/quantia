import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, TrendingUp, CheckCircle, Clock, Users, ChevronRight, Edit3 } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { EstadoBadge } from '../components/ui/Badge'
import { useOrcamentos } from '../hooks/useOrcamento'
import { useClientes } from '../hooks/useClientes'
import { formatarMoeda } from '../lib/validacoes'

export default function Home() {
  const navigate = useNavigate()
  const { orcamentos, loading: loadingOrc } = useOrcamentos()
  const { clientes, loading: loadingCli } = useClientes()

  const mesAtual = new Date().toISOString().slice(0, 7)

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

  // Already sorted by created_at desc from the query
  const ultimosOrcamentos = orcamentos.slice(0, 5)
  const ultimosClientes = [...clientes]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5)

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
          <StatCard icon={<Clock size={20} />} label="Pendentes resposta" value={stats.pendentesCount} color="yellow" />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Last 5 orcamentos */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText size={15} className="text-primary" />
                Últimos orçamentos
              </h2>
              <button
                onClick={() => navigate('/orcamentos')}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Ver todos <ChevronRight size={13} />
              </button>
            </div>

            {loadingOrc ? (
              <div className="p-8 text-center text-gray-400 text-sm">A carregar...</div>
            ) : ultimosOrcamentos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-sm mb-3">Nenhum orçamento ainda.</p>
                <button
                  onClick={() => navigate('/orcamentos/novo')}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Criar primeiro orçamento
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {ultimosOrcamentos.map(orc => (
                  <button
                    key={orc.id}
                    onClick={() => navigate(`/orcamentos/${orc.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{orc.descricao}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {orc.numero}
                        {orc.clientes?.nome ? ` · ${orc.clientes.nome}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-sm font-semibold text-gray-900">{formatarMoeda(orc.total_com_iva)}</p>
                      <EstadoBadge estado={orc.estado} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Last 5 clientes */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users size={15} className="text-primary" />
                Últimos contactos
              </h2>
              <button
                onClick={() => navigate('/clientes')}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                Ver todos <ChevronRight size={13} />
              </button>
            </div>

            {loadingCli ? (
              <div className="p-8 text-center text-gray-400 text-sm">A carregar...</div>
            ) : ultimosClientes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-sm mb-3">Nenhum contacto ainda.</p>
                <button
                  onClick={() => navigate('/clientes')}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Adicionar contacto
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {ultimosClientes.map(cli => (
                  <button
                    key={cli.id}
                    onClick={() => navigate('/clientes')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary/50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {cli.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{cli.nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[cli.nif ? `NIF ${cli.nif}` : '', cli.telefone].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <Edit3 size={14} className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
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
