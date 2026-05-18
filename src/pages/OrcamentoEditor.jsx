import React, { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Save, FileDown, ChevronDown, ChevronUp, ArrowLeft, Loader2 } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import CapituloEditor from '../components/orcamento/CapituloEditor'
import ResumoPanel from '../components/orcamento/ResumoPanel'
import { useOrcamentoEditor } from '../hooks/useOrcamento'
import { useClientes } from '../hooks/useClientes'
import { gerarPDF } from '../lib/pdf'
import { exportarExcel } from '../lib/excel'
import { useAuthStore } from '../lib/store'
import Input, { Select, Textarea } from '../components/ui/Input'

export default function OrcamentoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { empresa } = useAuthStore()
  const { orcamento, setOrcamento, capitulos, setCapitulos, loading, saving, saveOrcamento } = useOrcamentoEditor(id)
  const { clientes } = useClientes()
  const [resumoAberto, setResumoAberto] = useState(true)

  const isNovo = !id || id === 'novo'

  const handleSave = async () => {
    const orcId = await saveOrcamento()
    if (isNovo && orcId) navigate(`/orcamentos/${orcId}`, { replace: true })
  }

  const handleOrcChange = useCallback((changes) => {
    setOrcamento(prev => ({ ...prev, ...changes }))
  }, [setOrcamento])

  const addCapitulo = useCallback(() => {
    setCapitulos(prev => [...prev, {
      id: 'local-' + Date.now(),
      nome: `Capítulo ${String(prev.length + 1).padStart(2, '0')}`,
      ordem: prev.length,
      artigos: [],
    }])
  }, [setCapitulos])

  const updateCapitulo = useCallback((capId, changes) => {
    setCapitulos(prev => prev.map(c => c.id === capId ? { ...c, ...changes } : c))
  }, [setCapitulos])

  const removeCapitulo = useCallback((capId) => {
    setCapitulos(prev => prev.filter(c => c.id !== capId))
  }, [setCapitulos])

  const moveCapitulo = useCallback((capId, dir) => {
    setCapitulos(prev => {
      const caps = [...prev]
      const idx = caps.findIndex(c => c.id === capId)
      if (dir === 'up' && idx > 0) [caps[idx - 1], caps[idx]] = [caps[idx], caps[idx - 1]]
      if (dir === 'down' && idx < caps.length - 1) [caps[idx], caps[idx + 1]] = [caps[idx + 1], caps[idx]]
      return caps
    })
  }, [setCapitulos])

  const addArtigo = useCallback((capId, artigo) => {
    setCapitulos(prev => prev.map(c =>
      c.id === capId ? { ...c, artigos: [...(c.artigos || []), artigo] } : c
    ))
  }, [setCapitulos])

  const updateArtigo = useCallback((capId, artId, changes) => {
    setCapitulos(prev => prev.map(c =>
      c.id === capId
        ? { ...c, artigos: (c.artigos || []).map(a => a.id === artId ? { ...a, ...changes } : a) }
        : c
    ))
  }, [setCapitulos])

  const removeArtigo = useCallback((capId, artId) => {
    setCapitulos(prev => prev.map(c =>
      c.id === capId ? { ...c, artigos: (c.artigos || []).filter(a => a.id !== artId) } : c
    ))
  }, [setCapitulos])

  // Show full-page spinner only when loading an existing orcamento
  if (loading) {
    return (
      <AppLayout title="A carregar...">
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!orcamento) {
    return (
      <AppLayout title="Erro">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Orçamento não encontrado.</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={isNovo ? 'Novo Orçamento' : orcamento.numero}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg text-gray-500 hover:bg-bg-secondary transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">
              {isNovo ? 'Novo Orçamento' : orcamento.numero}
            </h1>
            {saving && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> A guardar...
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => exportarExcel(orcamento, capitulos, empresa)}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium text-gray-600 hover:bg-bg-secondary transition-colors"
            >
              <FileDown size={15} />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => gerarPDF(orcamento, capitulos, empresa)}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium text-gray-600 hover:bg-bg-secondary transition-colors"
            >
              <FileDown size={15} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              Guardar
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Informações do Orçamento</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Número"
                  value={orcamento.numero || ''}
                  onChange={e => handleOrcChange({ numero: e.target.value })}
                />
                <div className="sm:col-span-2 lg:col-span-2">
                  <Input
                    label="Descrição da obra *"
                    value={orcamento.descricao || ''}
                    onChange={e => handleOrcChange({ descricao: e.target.value })}
                    placeholder="Ex: Remodelação de apartamento T3..."
                  />
                </div>
                <Input
                  label="Data de emissão"
                  type="date"
                  value={orcamento.data_emissao || ''}
                  onChange={e => handleOrcChange({ data_emissao: e.target.value })}
                />
                <Input
                  label="Data de validade"
                  type="date"
                  value={orcamento.data_validade || ''}
                  onChange={e => handleOrcChange({ data_validade: e.target.value })}
                />
                <Select
                  label="Estado"
                  value={orcamento.estado || 'rascunho'}
                  onChange={e => handleOrcChange({ estado: e.target.value })}
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="enviado">Enviado</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="recusado">Recusado</option>
                  <option value="expirado">Expirado</option>
                </Select>
              </div>
            </div>

            {/* Client */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Cliente</h2>
              <Select
                label="Selecionar cliente existente"
                value={orcamento.cliente_id || ''}
                onChange={e => handleOrcChange({ cliente_id: e.target.value || null })}
              >
                <option value="">— Sem cliente —</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}{c.nif ? ` · NIF ${c.nif}` : ''}</option>
                ))}
              </Select>
              {!orcamento.cliente_id && (
                <p className="text-xs text-gray-400 mt-2">
                  Selecione um cliente ou{' '}
                  <button onClick={() => navigate('/clientes')} className="text-primary hover:underline">
                    crie um novo
                  </button>.
                </p>
              )}
            </div>

            {/* Chapters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Capítulos e Artigos</h2>
                <button
                  onClick={addCapitulo}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-medium text-gray-600 hover:bg-bg-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus size={14} />
                  Capítulo
                </button>
              </div>

              {capitulos.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-border p-10 text-center">
                  <p className="text-gray-400 text-sm mb-3">Nenhum capítulo ainda. Adicione o primeiro para começar.</p>
                  <button
                    onClick={addCapitulo}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    + Adicionar capítulo
                  </button>
                </div>
              ) : (
                capitulos.map((cap, ci) => (
                  <CapituloEditor
                    key={cap.id}
                    capitulo={cap}
                    index={ci}
                    total={capitulos.length}
                    onUpdate={updateCapitulo}
                    onRemove={removeCapitulo}
                    onMoveUp={moveCapitulo}
                    onMoveDown={moveCapitulo}
                    onAddArtigo={addArtigo}
                    onUpdateArtigo={updateArtigo}
                    onRemoveArtigo={removeArtigo}
                  />
                ))
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-border p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Notas e Observações</h2>
              <Textarea
                label="Observações (aparece no PDF)"
                value={orcamento.observacoes || ''}
                onChange={e => handleOrcChange({ observacoes: e.target.value })}
                rows={3}
                placeholder="Condições de pagamento, prazo de execução, materiais..."
              />
              <Textarea
                label="Notas internas (não aparece no PDF)"
                value={orcamento.notas_internas || ''}
                onChange={e => handleOrcChange({ notas_internas: e.target.value })}
                rows={2}
                placeholder="Notas internas sobre esta obra..."
              />
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:w-80 shrink-0">
            <button
              onClick={() => setResumoAberto(!resumoAberto)}
              className="lg:hidden w-full flex items-center justify-between bg-white rounded-xl border border-border px-4 py-3 mb-3 text-sm font-semibold text-gray-700"
            >
              Resumo do orçamento
              {resumoAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <div className={`lg:block ${resumoAberto ? 'block' : 'hidden'} lg:sticky lg:top-6`}>
              <ResumoPanel
                orcamento={orcamento}
                capitulos={capitulos}
                onChange={handleOrcChange}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
