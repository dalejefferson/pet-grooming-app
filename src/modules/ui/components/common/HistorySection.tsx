import { useState } from 'react'
import { ChevronDown, ChevronRight, RotateCcw, Trash2, User, Dog, Scissors, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import type { DeletedItem, DeletedEntityType } from '@/modules/database/types'
import { useRestoreFromHistory, usePermanentDelete, getDeletedItemInfo } from '@/modules/database/hooks'

export interface HistorySectionProps {
  items: DeletedItem[]
  entityType?: DeletedEntityType
  title?: string
  className?: string
}

const entityIcons: Record<DeletedEntityType, React.ReactNode> = {
  client: <User className="h-4 w-4" />,
  pet: <Dog className="h-4 w-4" />,
  groomer: <Scissors className="h-4 w-4" />,
  service: <Sparkles className="h-4 w-4" />,
}

export function HistorySection({
  items,
  entityType,
  title = 'Recently Deleted',
  className,
}: HistorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const restoreFromHistory = useRestoreFromHistory()
  const permanentDelete = usePermanentDelete()

  const filteredItems = entityType
    ? items.filter((item) => item.entityType === entityType)
    : items

  if (filteredItems.length === 0) {
    return null
  }

  const handleRestore = async (item: DeletedItem) => {
    await restoreFromHistory.mutateAsync({
      id: item.id,
      entityType: item.entityType,
    })
  }

  const handlePermanentDelete = async (item: DeletedItem) => {
    await permanentDelete.mutateAsync(item.id)
  }

  return (
    <div className={cn('mt-8', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-gray-50 px-4 py-3 text-left transition-all hover:bg-gray-100"
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-[#64748b]" />
        ) : (
          <ChevronRight className="h-5 w-5 text-[#64748b]" />
        )}
        <span className="font-semibold text-[#334155]">{title}</span>
        <span className="ml-auto rounded-full bg-[#1e293b] px-2.5 py-0.5 text-xs font-medium text-white">
          {filteredItems.length}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 rounded-xl border-2 border-[#1e293b] bg-white p-4">
          {filteredItems.map((item) => {
            const { typeLabel, timeAgo } = getDeletedItemInfo(item)
            const icon = entityIcons[item.entityType]

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-[#64748b]">
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#334155]">
                    {item.entityName}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {typeLabel} · {timeAgo}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(item)}
                    disabled={restoreFromHistory.isPending}
                    className="gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePermanentDelete(item)}
                    disabled={permanentDelete.isPending}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
