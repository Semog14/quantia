import * as XLSX from 'xlsx'
import { calcularTotaisOrcamento } from './calculos'
import { formatarMoeda } from './validacoes'

export function exportarExcel(orcamento, capitulos, empresa) {
  const wb = XLSX.utils.book_new()
  const totais = calcularTotaisOrcamento({
    capitulos,
    pctImprevistos: orcamento.pct_imprevistos,
    pctMargem: orcamento.pct_margem,
    tipoIva: orcamento.tipo_iva,
  })

  const rows = []

  // Header
  rows.push([empresa?.nome || 'Empresa', '', '', '', '', ''])
  rows.push([`Orçamento Nº ${orcamento.numero}`, '', '', '', '', ''])
  rows.push([orcamento.descricao || '', '', '', '', '', ''])
  rows.push([`Data de emissão: ${orcamento.data_emissao}`, '', `Válido até: ${orcamento.data_validade}`, '', '', ''])
  if (orcamento.clientes) {
    rows.push([`Cliente: ${orcamento.clientes.nome || ''}`, '', `NIF: ${orcamento.clientes.nif || ''}`, '', '', ''])
  }
  rows.push([])
  rows.push(['#', 'Descrição', 'Unidade', 'Quantidade', 'P. Unitário (€)', 'Total (€)'])

  capitulos.forEach((cap, ci) => {
    rows.push([`${String(ci + 1).padStart(2, '0')} ${cap.nome}`, '', '', '', '', ''])
    ;(cap.artigos || []).forEach((art, ai) => {
      const total = (parseFloat(art.quantidade) || 0) * (parseFloat(art.preco_unitario) || 0)
      rows.push([
        String(ai + 1).padStart(2, '0'),
        art.descricao,
        art.unidade,
        parseFloat(art.quantidade) || 0,
        parseFloat(art.preco_unitario) || 0,
        total,
      ])
    })
    const subtotalCap = (cap.artigos || []).reduce((a, art) =>
      a + (parseFloat(art.quantidade) || 0) * (parseFloat(art.preco_unitario) || 0), 0)
    rows.push(['', 'Subtotal do capítulo', '', '', '', subtotalCap])
    rows.push([])
  })

  rows.push([])
  rows.push(['', '', '', '', 'Subtotal', totais.subtotal])
  if (totais.imprevistos > 0) rows.push(['', '', '', '', `Imprevistos (${orcamento.pct_imprevistos}%)`, totais.imprevistos])
  if (totais.margem > 0) rows.push(['', '', '', '', `Margem (${orcamento.pct_margem}%)`, totais.margem])
  rows.push(['', '', '', '', 'Base tributável', totais.baseTributavel])
  rows.push(['', '', '', '', totais.ivaLabel, totais.iva])
  rows.push(['', '', '', '', 'TOTAL c/ IVA', totais.totalComIva])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 8 }, { wch: 50 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Orçamento')
  XLSX.writeFile(wb, `${orcamento.numero}.xlsx`)
}
