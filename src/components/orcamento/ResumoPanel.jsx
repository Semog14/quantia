import React, { memo } from 'react'
import { formatarMoeda } from '../../lib/validacoes'
import { calcularTotaisOrcamento } from '../../lib/calculos'

function ResumoPanel({ orcamento, capitulos, onChange }) {
  const totais = calcularTotaisOrcamento({
    capitulos,
    pctImprevistos: orcamento.pct_imprevistos,
    pctMargem: orcamento.pct_margem,
    tipoIva: orcamento.tipo_iva,
  })

  return (
    <div className="space-y-4">
      {/* Configurações */}
      <div className="bg-white rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Configurações</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">% Imprevistos</label>
            <div className="relative">
              <input
                type="number"
                min="0" max="100" step="0.5"
                value={orcamento.pct_imprevistos}
                onChange={e => onChange({ pct_imprevistos: e.target.value })}
                className="w-full border border-border rounded-lg px-3 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">% Margem de lucro</label>
            <div className="relative">
              <input
                type="number"
                min="0" max="100" step="0.5"
                value={orcamento.pct_margem}
                onChange={e => onChange({ pct_margem: e.target.value })}
                className="w-full border border-border rounded-lg px-3 pr-7 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de IVA</label>
            <select
              value={orcamento.tipo_iva}
              onChange={e => onChange({ tipo_iva: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            >
              <option value="23">IVA 23% (normal)</option>
              <option value="6">IVA 6% (reabilitação urbana)</option>
              <option value="inversao">Inversão do sujeito passivo</option>
              <option value="isento">Isento de IVA</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={orcamento.mostrar_margem || false}
              onChange={e => onChange({ mostrar_margem: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-xs text-gray-600">Mostrar margem no PDF</span>
          </label>
        </div>
      </div>

      {/* Resumo financeiro */}
      <div className="bg-white rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumo</h3>
        <div className="space-y-2 text-sm">
          <TotalRow label="Subtotal" value={totais.subtotal} />
          {totais.imprevistos > 0 && (
            <TotalRow label={`Imprevistos (${orcamento.pct_imprevistos}%)`} value={totais.imprevistos} />
          )}
          {totais.margem > 0 && (
            <TotalRow label={`Margem (${orcamento.pct_margem}%)`} value={totais.margem} />
          )}
          <TotalRow label="Base tributável" value={totais.baseTributavel} bordered />
          <TotalRow label={totais.ivaLabel} value={totais.iva} note={totais.taxaIva === 0 && orcamento.tipo_iva === 'inversao' ? 'Inv. SP' : null} />
          <div className="border-t-2 border-gray-200 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">TOTAL c/ IVA</span>
              <span className="text-lg font-bold text-primary">{formatarMoeda(totais.totalComIva)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Only re-render when financial fields or capitulos change
export default memo(ResumoPanel, (prev, next) => {
  return (
    prev.capitulos === next.capitulos &&
    prev.orcamento.pct_imprevistos === next.orcamento.pct_imprevistos &&
    prev.orcamento.pct_margem === next.orcamento.pct_margem &&
    prev.orcamento.tipo_iva === next.orcamento.tipo_iva &&
    prev.orcamento.mostrar_margem === next.orcamento.mostrar_margem &&
    prev.onChange === next.onChange
  )
})

function TotalRow({ label, value, bordered, note }) {
  return (
    <div className={`flex justify-between items-center ${bordered ? 'border-t border-border pt-2 mt-1' : ''}`}>
      <span className="text-gray-600">{label}{note && <span className="ml-1 text-xs text-gray-400">({note})</span>}</span>
      <span className="font-medium text-gray-900">{formatarMoeda(value)}</span>
    </div>
  )
}
