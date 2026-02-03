import { cn } from '@/lib/utils'

export interface SkeletonProps {
  variant?: 'card' | 'list' | 'table' | 'text'
  count?: number
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl border-2 border-[#1e293b] bg-gray-100',
        className
      )}
    />
  )
}

function CardSkeleton() {
  return (
    <div className="aspect-square rounded-2xl border-2 border-[#1e293b] bg-white p-4 shadow-[3px_3px_0px_0px_#1e293b]">
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <SkeletonBlock className="h-20 w-20 rounded-2xl border-0" />
        <SkeletonBlock className="h-4 w-24 rounded-lg border-0" />
        <SkeletonBlock className="h-3 w-16 rounded-lg border-0" />
        <div className="flex gap-1.5">
          <SkeletonBlock className="h-5 w-12 rounded-lg border-0" />
          <SkeletonBlock className="h-5 w-12 rounded-lg border-0" />
        </div>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[3px_3px_0px_0px_#1e293b]">
      <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full border-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-3/4 rounded-lg border-0" />
        <SkeletonBlock className="h-3 w-1/2 rounded-lg border-0" />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-gray-200 py-3 px-4">
      <SkeletonBlock className="h-4 w-1/4 rounded-lg border-0" />
      <SkeletonBlock className="h-4 w-1/4 rounded-lg border-0" />
      <SkeletonBlock className="h-4 w-1/6 rounded-lg border-0" />
      <SkeletonBlock className="h-4 w-1/6 rounded-lg border-0" />
    </div>
  )
}

function TextSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="h-4 w-full rounded-lg border-0" />
      <SkeletonBlock className="h-4 w-5/6 rounded-lg border-0" />
      <SkeletonBlock className="h-4 w-4/6 rounded-lg border-0" />
    </div>
  )
}

const VARIANT_MAP = {
  card: CardSkeleton,
  list: ListSkeleton,
  table: TableSkeleton,
  text: TextSkeleton,
}

export function Skeleton({ variant = 'card', count = 1 }: SkeletonProps) {
  const Component = VARIANT_MAP[variant]
  const isGrid = variant === 'card'

  return (
    <div className={isGrid ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'space-y-3'}>
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
    </div>
  )
}
