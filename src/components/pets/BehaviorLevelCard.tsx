import { Card, CardTitle, Badge } from '@/components/common'
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
              className={`h-8 flex-1 rounded text-sm font-medium transition-colors ${
                level === pet.behaviorLevel
                  ? level <= 2
                    ? 'bg-success-500 text-white'
                    : level >= 4
                    ? 'bg-warning-500 text-white'
                    : 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
