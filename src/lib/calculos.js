export function calcularTotaisOrcamento({ capitulos, pctImprevistos, pctMargem, tipoIva }) {
  const subtotal = capitulos.reduce((acc, cap) => {
    const subtotalCap = (cap.artigos || []).reduce((a, art) => {
      return a + (parseFloat(art.quantidade) || 0) * (parseFloat(art.preco_unitario) || 0)
    }, 0)
    return acc + subtotalCap
  }, 0)

  const imprevistos = subtotal * ((parseFloat(pctImprevistos) || 0) / 100)
  const margem = subtotal * ((parseFloat(pctMargem) || 0) / 100)
  const baseTributavel = subtotal + imprevistos + margem

  let taxaIva = 0
  let ivaLabel = ''
  if (tipoIva === '23') { taxaIva = 0.23; ivaLabel = 'IVA 23%' }
  else if (tipoIva === '6') { taxaIva = 0.06; ivaLabel = 'IVA 6%' }
  else if (tipoIva === 'inversao') { taxaIva = 0; ivaLabel = 'Inversão do sujeito passivo' }
  else if (tipoIva === 'isento') { taxaIva = 0; ivaLabel = 'Isento de IVA' }

  const iva = baseTributavel * taxaIva
  const totalComIva = baseTributavel + iva

  return { subtotal, imprevistos, margem, baseTributavel, iva, totalComIva, ivaLabel, taxaIva }
}

export function calcularSubtotalCapitulo(artigos) {
  return (artigos || []).reduce((acc, art) => {
    return acc + (parseFloat(art.quantidade) || 0) * (parseFloat(art.preco_unitario) || 0)
  }, 0)
}
