import { cn } from '@/lib/utils'

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'stone' | 'emerald'

const colors: Record<Color, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  stone: 'bg-stone-100 text-stone-700',
  emerald: 'bg-emerald-100 text-emerald-800',
}

interface BadgeProps {
  children: React.ReactNode
  color?: Color
  className?: string
}

export function Badge({ children, color = 'stone', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        colors[color],
        className
      )}
    >
      {children}
    </span>
  )
}
