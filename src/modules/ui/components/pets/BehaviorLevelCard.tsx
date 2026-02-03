import { Card, CardTitle, Badge } from '../common'
import { BEHAVIOR_LEVEL_LABELS } from '@/config/constants'
import type { Pet } from '@/types'

export interface BehaviorLevelCardProps {
  pet: Pet
  onBehaviorChange: (level: number) => Promise<void>
}

export function BehaviorLevelCard({ pet, onBehaviorChange }: BehaviorLevelCardProps) {
  return (
    <Card>
      <CardTitle>Behavior Level</CardTitle>
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <Badge
            variant={pet.behaviorLevel <= 2 ? 'success' : pet.behaviorLevel >= 4 ? 'warning' : 'secondary'}
          >
            {BEHAVIOR_LEVEL_LABELS[pet.behaviorLevel]}
          </Badge>
          <span className="text-sm text-gray-500">{pet.behaviorLevel}/5</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => onBehaviorChange(level)}
              className={`flex-1 rounded-lg border-2 border-[#1e293b] px-2.5 py-1 text-xs font-semibold shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b] ${
                level === pet.behaviorLevel
                  ? level <= 2
                    ? 'bg-[#d1fae5] text-[#166534]'
                    : level >= 4
                    ? 'bg-[#fef9c3] text-[#a16207]'
                    : 'bg-[#f1f5f9] text-[#334155]'
                  : 'bg-white text-[#334155]'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          1 = Very Calm, 5 = Difficult
        </p>
      </div>
    </Card>
  )
}
