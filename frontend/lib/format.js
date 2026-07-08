// Format an INR amount into a compact, readable string (Lakh / Crore).
export const formatINR = (amount) => {
  if (amount == null || isNaN(amount)) return '—'
  if (amount >= 10000000) {
    const cr = amount / 10000000
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    const lakh = amount / 100000
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakh`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

// Full rupee value with Indian digit grouping.
export const formatINRFull = (amount) => {
  if (amount == null || isNaN(amount)) return '—'
  return `₹${amount.toLocaleString('en-IN')}`
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Days remaining until a given date (returns negative if past).
export const daysUntil = (dateStr) => {
  if (!dateStr) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return null
  target.setHours(0, 0, 0, 0)
  return Math.round((target - now) / (1000 * 60 * 60 * 24))
}

// Render an auction time that may be an ISO timestamp (API) or "HH:MM" (sample).
export const formatTime = (value) => {
  if (!value) return null
  if (/^\d{1,2}:\d{2}$/.test(value)) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

// Compact integer formatting for stat counters (e.g. 89,144).
export const formatCount = (n) => {
  if (n == null || isNaN(n)) return '0'
  return Number(n).toLocaleString('en-IN')
}
