import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

  type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'brand'
  type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

  const variants: Record<Variant, string> = {
    primary:
      'bg-white text-stone-900 hover:bg-stone-100 focus:ring-stone-400 shadow-sm',
    secondary:
      'bg-stone-800 text-white hover:bg-stone-900 focus:ring-stone-500',
    outline:
      'border border-stone-300 text-stone-700 hover:bg-stone-50 focus:ring-stone-400 bg-white',
    ghost:
      'text-stone-600 hover:bg-stone-100 focus:ring-stone-400',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    brand:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
  }

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, fullWidth, children, disabled, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
