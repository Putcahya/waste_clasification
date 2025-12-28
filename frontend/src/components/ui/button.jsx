import React from 'react'
import clsx from 'clsx'

export function Button({ children, className, variant = 'default', size = 'md', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none'

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    glass: 'bg-white/5 border border-white/10 text-white',
    scanner: 'bg-gradient-to-r from-primary to-accent text-white',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-lg',
  }

  return (
    <button className={clsx(base, variants[variant] ?? variants.default, sizes[size] ?? sizes.md, className)} {...props}>
      {children}
    </button>
  )
}
