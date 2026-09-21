export const ROLES = {
  ADMIN: 'admin',
  VENDEDOR: 'vendedor',
}

export const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
}

export const USER_STATUS_LABELS = {
  [USER_STATUS.PENDING]: { label: 'Pendiente de Aprobación', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  [USER_STATUS.ACTIVE]: { label: 'Activo', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  [USER_STATUS.SUSPENDED]: { label: 'Suspendido', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
}

export const REPAIR_STATUS = {
  RECEIVED: 'recibido',
  IN_PROGRESS: 'en_proceso',
  READY: 'listo',
  DELIVERED: 'entregado',
}

export const REPAIR_STATUS_LABELS = {
  [REPAIR_STATUS.RECEIVED]: { label: 'Recibido', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  [REPAIR_STATUS.IN_PROGRESS]: { label: 'En Proceso', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  [REPAIR_STATUS.READY]: { label: 'Listo para Entrega', bg: 'bg-purple-500/20', text: 'text-purple-400' },
  [REPAIR_STATUS.DELIVERED]: { label: 'Entregado', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
}

export const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'qr', label: 'Pago QR' },
  { id: 'transferencia', label: 'Transferencia Bancaria' },
]

export const ITEMS_PER_PAGE = 30

