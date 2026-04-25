import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, onWheel, type, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    // Evita que el scroll del mouse cambie el valor en inputs numéricos
    const handleWheel: React.WheelEventHandler<HTMLInputElement> = (e) => {
      if (type === 'number') (e.target as HTMLInputElement).blur()
      onWheel?.(e)
    }
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-stone-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          onWheel={handleWheel}
          className={cn(
            'w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900',
            'placeholder:text-stone-400 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
            'disabled:bg-stone-50 disabled:text-stone-400',
            error && 'border-red-400 focus:ring-red-400',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-stone-400">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-stone-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900',
            'placeholder:text-stone-400 text-sm resize-y min-h-[100px]',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
            error && 'border-red-400 focus:ring-red-400',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
