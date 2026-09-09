import { adminDb, requireAdmin } from '../_lib/firebaseAdmin.js'

const ALLOWED_STATUSES = ['pending', 'confirmed', 'purchasing', 'shipped', 'completed', 'rejected']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    await requireAdmin(req)
  } catch (err) {
    res.status(err.statusCode || 401).json({ error: err.message })
    return
  }

  const { orderId, status, adminNote } = req.body || {}

  if (!orderId || !status || !ALLOWED_STATUSES.includes(status)) {
    res.status(400).json({ error: 'A valid orderId and status are required' })
    return
  }

  try {
    const orderRef = adminDb.ref(`orders/${orderId}`)
    const snap = await orderRef.get()
    if (!snap.exists()) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    const updates = { status, updatedAt: Date.now() }
    if (typeof adminNote === 'string') updates.adminNote = adminNote

    await orderRef.update(updates)
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('update-status error', err)
    res.status(500).json({ error: 'Error updating the status', detail: err.message })
  }
}
