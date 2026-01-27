import { Calendar, Clock } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { format } from 'date-fns'

interface BookingSummaryCardProps {
  startTime: Date
  endTime: Date
  totalDuration: number
}

export function BookingSummaryCard({
  startTime,
  endTime,
  totalDuration,
}: BookingSummaryCardProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
        <Calendar className="h-6 w-6 text-primary-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">
          {format(startTime, 'EEEE, MMMM d, yyyy')}
        </p>
        <p className="text-gray-600">
          {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          {formatDuration(totalDuration)}
        </div>
      </div>
    </div>
  )
}
