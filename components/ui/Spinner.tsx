import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-20', className)}>
      <div className="h-10 w-10 rounded-full border-4 border-stone-200 border-t-brand animate-spin" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-stone-100 animate-pulse">
      <div className="h-56 bg-stone-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-stone-200 rounded w-3/4" />
        <div className="h-3 bg-stone-200 rounded w-1/2" />
        <div className="h-4 bg-stone-200 rounded w-1/3 mt-2" />
      </div>
    </div>
  )
}
