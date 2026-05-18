import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatarMoeda } from './validacoes'
import { calcularTotaisOrcamento } from './calculos'

export function gerarPDF(orcamento, capitulos, empresa) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 15
  const pageW = 210
  const contentW = pageW - margin * 2
  let y = margin

  // ── Header ──────────────────────────────────────────────────────────────
  // Logo placeholder or company name
  if (empresa?.logo_url) {
    try { doc.addImage(empresa.logo_url, 'PNG', margin, y, 30, 15); } catch (_) {}
  }

  // Company info (right side)
  doc.setFontSize(8)
  doc.setTextColor(100)
  const companyLines = [
    empresa?.nome || 'Empresa',
    empresa?.nif ? `NIF: ${empresa.nif}` : '',
    empresa?.morada || '',
    [empresa?.codigo_postal, empresa?.localidade].filter(Boolean).join(' '),
    empresa?.telefone || '',
    empresa?.email || '',
  ].filter(Boolean)

  const rightX = pageW - margin
  companyLines.forEach((line, i) => {
    doc.text(line, rightX, y + 4 + i * 4, { align: 'right' })
  })

  y += Math.max(20, companyLines.length * 4 + 6)

  // Separator line
  doc.setDrawColor(224, 112, 32)
  doc.setLineWidth(0.8)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // ── Title ──────────────────────────────────────────────────────────────
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(30)
  doc.text(`ORÇAMENTO Nº ${orcamento.numero}`, margin, y)
  y += 6

  doc.setFontSize(8)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100)
  doc.text(`Data de emissão: ${formatarData(orcamento.data_emissao)}`, margin, y)
  doc.text(`Válido até: ${formatarData(orcamento.data_validade)}`, pageW - margin, y, { align: 'right' })
  y += 5

  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(50)
  doc.text(orcamento.descricao || '', margin, y)
  y += 8

  // ── Client block ──────────────────────────────────────────────────────
  if (orcamento.clientes) {
    doc.setFillColor(248, 246, 243)
    doc.roundedRect(margin, y, contentW, 22, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(100)
    doc.text('CLIENTE', margin + 4, y + 5)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(30)
    doc.setFontSize(9)
    doc.text(orcamento.clientes.nome || '', margin + 4, y + 10)
    doc.setFontSize(8)
    doc.setTextColor(80)
    const clienteInfo = [
      orcamento.clientes.nif ? `NIF: ${orcamento.clientes.nif}` : '',
      orcamento.clientes.morada || '',
      [orcamento.clientes.codigo_postal, orcamento.clientes.localidade].filter(Boolean).join(' '),
      orcamento.clientes.telefone || '',
    ].filter(Boolean).join('  ·  ')
    doc.text(clienteInfo, margin + 4, y + 15)
    y += 27
  }

  // ── Chapters & articles ───────────────────────────────────────────────
  const totais = calcularTotaisOrcamento({
    capitulos,
    pctImprevistos: orcamento.pct_imprevistos,
    pctMargem: orcamento.pct_margem,
    tipoIva: orcamento.tipo_iva,
  })

  capitulos.forEach((cap, ci) => {
    // Chapter header
    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [[{ content: `${String(ci + 1).padStart(2, '0')}  ${cap.nome}`, colSpan: 6 }]],
      body: (cap.artigos || []).map((art, ai) => [
        String(ai + 1).padStart(2, '0'),
        art.descricao,
        art.unidade,
        formatarNumero(art.quantidade),
        formatarMoeda(art.preco_unitario),
        formatarMoeda((parseFloat(art.quantidade) || 0) * (parseFloat(art.preco_unitario) || 0)),
      ]),
      foot: [[{ content: 'Subtotal do capítulo', colSpan: 5, styles: { halign: 'right' } },
              formatarMoeda(calcSubcap(cap.artigos))]],
      columns: [
        { header: '#', dataKey: 0 },
        { header: 'Descrição', dataKey: 1 },
        { header: 'Un.', dataKey: 2 },
        { header: 'Qtd.', dataKey: 3 },
        { header: 'P. Unit.', dataKey: 4 },
        { header: 'Total', dataKey: 5 },
      ],
      headStyles: {
        fillColor: [224, 112, 32],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7.5, textColor: 40 },
      footStyles: { fontSize: 8, fontStyle: 'bold', textColor: 40, fillColor: [240, 238, 235] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 18, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' },
      },
      didDrawPage: (data) => { y = data.cursor.y },
    })
    y = doc.lastAutoTable.finalY + 4
  })

  y += 4

  // ── Totals ────────────────────────────────────────────────────────────
  const totaisRows = [
    ['Subtotal', formatarMoeda(totais.subtotal)],
    orcamento.pct_imprevistos > 0 ? [`Imprevistos (${orcamento.pct_imprevistos}%)`, formatarMoeda(totais.imprevistos)] : null,
    orcamento.mostrar_margem && orcamento.pct_margem > 0 ? [`Margem (${orcamento.pct_margem}%)`, formatarMoeda(totais.margem)] : null,
    ['Base tributável', formatarMoeda(totais.baseTributavel)],
    orcamento.tipo_iva === 'inversao'
      ? ['IVA — Inversão do sujeito passivo', '—']
      : [totais.ivaLabel, formatarMoeda(totais.iva)],
  ].filter(Boolean)

  doc.autoTable({
    startY: y,
    margin: { left: pageW / 2, right: margin },
    body: totaisRows,
    foot: [['TOTAL c/ IVA', formatarMoeda(totais.totalComIva)]],
    bodyStyles: { fontSize: 8, textColor: 60 },
    footStyles: { fontSize: 11, fontStyle: 'bold', textColor: [184, 90, 10], fillColor: [255, 246, 237] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'right' },
    },
    theme: 'plain',
    didDrawPage: (data) => { y = data.cursor.y },
  })

  y = doc.lastAutoTable.finalY + 8

  // ── Observations ─────────────────────────────────────────────────────
  if (orcamento.observacoes) {
    doc.setFontSize(8)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(60)
    doc.text('Observações:', margin, y)
    y += 4
    doc.setFont(undefined, 'normal')
    doc.setTextColor(80)
    const lines = doc.splitTextToSize(orcamento.observacoes, contentW)
    doc.text(lines, margin, y)
    y += lines.length * 4 + 4
  }

  // Validity notice
  doc.setFontSize(7.5)
  doc.setTextColor(120)
  doc.setFont(undefined, 'italic')
  const validade = calcularDiasValidade(orcamento.data_emissao, orcamento.data_validade)
  doc.text(`Este orçamento é válido por ${validade} dias a partir da data de emissão.`, margin, y)

  // ── Footer on each page ───────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(224, 112, 32)
    doc.setLineWidth(0.3)
    doc.line(margin, 285, pageW - margin, 285)
    doc.setFontSize(7)
    doc.setTextColor(160)
    doc.setFont(undefined, 'normal')
    doc.text('Quantia — Software de orçamentação para construção civil', margin, 289)
    doc.text(`Página ${i} de ${pageCount}`, pageW - margin, 289, { align: 'right' })
  }

  doc.save(`${orcamento.numero}.pdf`)
}

function calcSubcap(artigos) {
  return (artigos || []).reduce((a, art) =>
    a + (parseFloat(art.quantidade) || 0) * (parseFloat(art.preco_unitario) || 0), 0)
}

function formatarData(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-PT')
}

function formatarNumero(n) {
  return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
}

function calcularDiasValidade(emissao, validade) {
  if (!emissao || !validade) return 30
  const diff = new Date(validade) - new Date(emissao)
  return Math.round(diff / 864e5)
}
