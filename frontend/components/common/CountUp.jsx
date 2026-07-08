'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

// Animated count-up that triggers once when scrolled into view.
export default function CountUp({ end = 0, suffix = '', duration = 1600, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * end))
      if (progress < 1) raf = requestAnimationFrame(tick)
      else setValue(end)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, end, duration])

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}
