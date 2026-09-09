// Indicative CNY -> MGA rate used only to give buyers a rough idea of the
// price before checkout. The admin confirms the exact amount to pay (goods +
// international shipping + service fee) once the order is reviewed.
export const CNY_TO_MGA = 650
export const CNY_TO_USD = 0.14

export function formatYuan(value) {
  if (value === null || value === undefined) return '—'
  return `¥${Number(value).toFixed(2)}`
}

export function formatMga(cnyValue) {
  if (cnyValue === null || cnyValue === undefined) return ''
  const mga = Math.round(cnyValue * CNY_TO_MGA)
  return `≈ ${mga.toLocaleString('fr-FR')} Ar`
}

export function formatUsd(cnyValue) {
  if (cnyValue === null || cnyValue === undefined) return ''
  return `≈ $${(cnyValue * CNY_TO_USD).toFixed(2)}`
}
