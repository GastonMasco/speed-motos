/**
 * Formatea un monto numérico a formato de moneda Boliviana (Bs.)
 * Ejemplo: formatBs(125.5) -> "Bs. 125,50"
 */
export const formatBs = (amount) => {
  const num = Number(amount) || 0
  return `Bs. ${num.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Formatea una fecha ISO a formato legible en español
 * Ejemplo: formatDate("2026-09-16T08:30:00Z") -> "16 sep 2026, 08:30"
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Formatea solo la fecha (sin hora)
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
