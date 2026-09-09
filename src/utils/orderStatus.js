export const STATUS_META = {
  pending: { label: 'Awaiting confirmation', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Payment confirmed', color: 'bg-blue-100 text-blue-700' },
  purchasing: { label: 'Purchase in progress', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: 'Shipping', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completed / Received', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' }
}

export function statusMeta(status) {
  return STATUS_META[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
}
