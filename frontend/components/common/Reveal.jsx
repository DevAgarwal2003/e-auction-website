'use client'

import { motion } from 'framer-motion'

const directions = {
  up: { y: 28, x: 0 },
  down: { y: -28, x: 0 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
}

/**
 * Scroll-triggered entrance animation wrapper.
 * Fades + slides children into view once, with an optional stagger delay.
 */
export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className,
  once = true,
  as = 'div',
  amount = 0.2,
}) {
  const offset = directions[direction] || directions.up
  const MotionTag = motion[as] || motion.div

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </MotionTag>
  )
}
