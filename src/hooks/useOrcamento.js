import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getEmpresaId } from '../lib/auth'
import { useAuthStore } from '../lib/store'
import { gerarNumeroOrcamento } from '../lib/validacoes'

// ─── List (Dashboard) ────────────────────────────────────────────────────────

export function useOrcamentos() {
  const [orcamentos, setOrcamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const { empresa } = useAuthStore()

  useEffect(() => {
    if (!empresa) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    supabase
      .from('orcamentos')
      .select('*, clientes(nome)')
      .eq('empresa_id', empresa.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) { setOrcamentos(data || []); setLoading(false) }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [empresa])

  const refetch = () => {
    if (!empresa) return
    setLoading(true)
    supabase
      .from('orcamentos')
      .select('*, clientes(nome)')
      .eq('empresa_id', empresa.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setOrcamentos(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  return { orcamentos, loading, refetch }
}

// ─── Editor ──────────────────────────────────────────────────────────────────

function defaultOrcamento() {
  const hoje = new Date().toISOString().split('T')[0]
  const validade = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]
  return {
    numero: `ORC-${new Date().getFullYear()}-NOVO`,
    descricao: '',
    cliente_id: null,
    data_emissao: hoje,
    data_validade: validade,
    estado: 'rascunho',
    pct_imprevistos: 5,
    pct_margem: 10,
    tipo_iva: '23',
    mostrar_margem: false,
    observacoes: '',
    notas_internas: '',
  }
}

export function useOrcamentoEditor(id) {
  const isNovo = !id || id === 'novo'
  const { empresa } = useAuthStore()

  // For 'novo': start with defaults immediately (no loading)
  // For existing: start null with loading=true
  const [orcamento, setOrcamento] = useState(isNovo ? defaultOrcamento() : null)
  const [capitulos, setCapitulos] = useState([])
  const [loading, setLoading] = useState(!isNovo)
  const [saving, setSaving] = useState(false)
  const empresaApplied = useRef(false)

  // When empresa loads, update defaults for 'novo'
  useEffect(() => {
    if (!isNovo || !empresa || empresaApplied.current) return
    empresaApplied.current = true
    const validade = new Date(Date.now() + (empresa.config_validade || 30) * 864e5).toISOString().split('T')[0]
    setOrcamento(prev => ({
      ...prev,
      pct_imprevistos: empresa.config_imprevistos ?? 5,
      pct_margem: empresa.config_margem ?? 10,
      tipo_iva: empresa.config_iva || '23',
      data_validade: validade,
      observacoes: empresa.config_rodape || '',
    }))
  }, [isNovo, empresa])

  // Fetch existing orcamento
  useEffect(() => {
    if (isNovo || !id) return
    let cancelled = false
    setLoading(true)

    const fetch = async () => {
      try {
        const [{ data: orc }, { data: caps }] = await Promise.all([
          supabase.from('orcamentos').select('*, clientes(*)').eq('id', id).single(),
          supabase.from('capitulos').select('*, artigos_orcamento(*)').eq('orcamento_id', id).order('ordem'),
        ])
        if (cancelled) return
        if (caps) caps.forEach(c => c.artigos_orcamento?.sort((a, b) => a.ordem - b.ordem))
        setOrcamento(orc || null)
        setCapitulos((caps || []).map(c => ({ ...c, artigos: c.artigos_orcamento || [] })))
      } catch (e) {
        console.error('Erro ao carregar orçamento:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [id, isNovo])

  // ─── Save ─────────────────────────────────────────────────────────────────

  const saveOrcamento = async () => {
    if (!orcamento) return null
    setSaving(true)

    const empresaId = await getEmpresaId()
    if (!empresaId) {
      alert('Erro: sessão expirada. Por favor, recarregue a página.')
      setSaving(false)
      return null
    }

    const subtotal = calcSubtotal(capitulos)
    const { totalComIva } = calcTotais(subtotal, orcamento)
    let orcId = orcamento.id

    try {
      const payload = {
        empresa_id: empresaId,
        descricao: orcamento.descricao || 'Sem descrição',
        cliente_id: orcamento.cliente_id || null,
        data_emissao: orcamento.data_emissao,
        data_validade: orcamento.data_validade,
        estado: orcamento.estado,
        pct_imprevistos: parseFloat(orcamento.pct_imprevistos) || 0,
        pct_margem: parseFloat(orcamento.pct_margem) || 0,
        tipo_iva: orcamento.tipo_iva,
        mostrar_margem: orcamento.mostrar_margem || false,
        observacoes: orcamento.observacoes || '',
        notas_internas: orcamento.notas_internas || '',
        subtotal,
        total_com_iva: totalComIva,
        updated_at: new Date().toISOString(),
      }

      if (!orcId) {
        // Generate sequential number from highest existing sequence for this year
        const ano = new Date().getFullYear()
        const { data: ultimos } = await supabase
          .from('orcamentos')
          .select('numero')
          .eq('empresa_id', empresaId)
          .like('numero', `ORC-${ano}-%`)
          .order('numero', { ascending: false })
          .limit(1)
        let seq = 1
        if (ultimos?.length) {
          const last = ultimos[0].numero // e.g. "ORC-2025-007"
          const parts = last.split('-')
          const lastSeq = parseInt(parts[parts.length - 1], 10)
          if (!isNaN(lastSeq)) seq = lastSeq + 1
        }
        payload.numero = gerarNumeroOrcamento(seq, ano)

        const { data, error } = await supabase.from('orcamentos').insert(payload).select().single()
        if (error) throw error
        orcId = data.id
        setOrcamento(prev => ({ ...prev, id: orcId, numero: payload.numero }))
      } else {
        payload.numero = orcamento.numero
        const { error } = await supabase.from('orcamentos').update(payload).eq('id', orcId)
        if (error) throw error
      }

      // Save chapters and articles in bulk
      for (let ci = 0; ci < capitulos.length; ci++) {
        const cap = capitulos[ci]
        let capId = cap.id

        if (!capId || capId.startsWith('local-')) {
          const { data, error } = await supabase
            .from('capitulos')
            .insert({ orcamento_id: orcId, nome: cap.nome, ordem: ci })
            .select().single()
          if (error) throw error
          capId = data.id
          setCapitulos(prev => prev.map((c, i) => i === ci ? { ...c, id: capId } : c))
        } else {
          await supabase.from('capitulos').update({ nome: cap.nome, ordem: ci }).eq('id', capId)
        }

        for (let ai = 0; ai < (cap.artigos || []).length; ai++) {
          const art = cap.artigos[ai]
          const artPayload = {
            capitulo_id: capId,
            orcamento_id: orcId,
            descricao: art.descricao,
            unidade: art.unidade,
            quantidade: parseFloat(art.quantidade) || 0,
            preco_unitario: parseFloat(art.preco_unitario) || 0,
            ordem: ai,
          }
          if (!art.id || art.id.startsWith('local-')) {
            const { data } = await supabase.from('artigos_orcamento').insert(artPayload).select().single()
            setCapitulos(prev => prev.map((c, ci2) =>
              ci2 !== ci ? c : { ...c, artigos: c.artigos.map((a, ai2) => ai2 !== ai ? a : { ...a, id: data?.id }) }
            ))
          } else {
            await supabase.from('artigos_orcamento').update(artPayload).eq('id', art.id)
          }
        }
      }
    } catch (e) {
      console.error('Erro ao guardar:', e)
      alert('Erro ao guardar o orçamento. Verifique a consola.')
    } finally {
      setSaving(false)
    }
    return orcId
  }

  return { orcamento, setOrcamento, capitulos, setCapitulos, loading, saving, saveOrcamento }
}

function calcSubtotal(capitulos) {
  return capitulos.reduce((acc, cap) =>
    acc + (cap.artigos || []).reduce((a, art) =>
      a + (parseFloat(art.quantidade) || 0) * (parseFloat(art.preco_unitario) || 0), 0), 0)
}

function calcTotais(subtotal, orc) {
  const imp = subtotal * ((parseFloat(orc.pct_imprevistos) || 0) / 100)
  const mar = subtotal * ((parseFloat(orc.pct_margem) || 0) / 100)
  const base = subtotal + imp + mar
  const taxa = orc.tipo_iva === '23' ? 0.23 : orc.tipo_iva === '6' ? 0.06 : 0
  return { totalComIva: base + base * taxa }
}
