export function validarNIF(nif) {
  if (!nif || typeof nif !== 'string') return false
  const n = nif.replace(/\s/g, '')
  if (!/^\d{9}$/.test(n)) return false
  const firstDigit = parseInt(n[0])
  // Valid first digits: 1,2,3,5,6,7,8,9
  if (![1, 2, 3, 5, 6, 7, 8, 9].includes(firstDigit)) return false
  let sum = 0
  for (let i = 0; i < 8; i++) {
    sum += parseInt(n[i]) * (9 - i)
  }
  const mod = sum % 11
  const checkDigit = mod < 2 ? 0 : 11 - mod
  return checkDigit === parseInt(n[8])
}

export function formatarMoeda(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '0,00 €'
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

export function formatarNumero(valor, decimais = 2) {
  if (valor === null || valor === undefined || isNaN(valor)) return '0'
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(valor)
}

export function parsearNumero(str) {
  if (!str) return 0
  // Handle Portuguese format (1.234,56 → 1234.56)
  const cleaned = String(str).replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function gerarNumeroOrcamento(sequencia, ano) {
  const seq = String(sequencia).padStart(3, '0')
  return `ORC-${ano}-${seq}`
}
