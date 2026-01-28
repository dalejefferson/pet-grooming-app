import { Check } from 'lucide-react'
import { Card, CardTitle, Input } from '../common'
import { formatCurrency, cn } from '@/lib/utils'
import type { TipOption } from '@/types'

interface TipSelectorProps {
  selectedTip: TipOption
  onTipChange: (tip: TipOption) => void
  customTipAmount: number
  onCustomTipChange: (amount: number) => void
  totalPrice: number
  tipAmount: number
}

export function TipSelector({
  selectedTip,
  onTipChange,
  customTipAmount,
  onCustomTipChange,
  totalPrice,
  tipAmount,
}: TipSelectorProps) {
  const tipOptions: { value: TipOption; label: string }[] = [
    { value: 'none', label: 'No Tip' },
    { value: '5', label: '5%' },
    { value: '10', label: '10%' },
    { value: '15', label: '15%' },
    { value: 'custom', label: 'Custom' },
  ]

  return (
    <Card>
      <CardTitle>Add a Tip</CardTitle>
      <p className="mt-1 text-sm text-gray-500">Show appreciation for our groomers</p>
      <div className="mt-4">
        {/* Tip toggle buttons */}
        <div className="flex flex-wrap gap-2">
          {tipOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onTipChange(option.value)}
              className={cn(
                'rounded-xl border-2 border-[#1e293b] px-4 py-2 text-sm font-semibold transition-all duration-150',
                selectedTip === option.value
                  ? 'bg-[#fcd9bd] shadow-[2px_2px_0px_0px_#1e293b] -translate-y-0.5'
                  : 'bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_#1e293b] hover:-translate-y-0.5'
              )}
            >
              {option.label}
              {option.value !== 'none' &&
                option.value !== 'custom' &&
                ` (${formatCurrency(totalPrice * (parseInt(option.value) / 100))})`}
            </button>
          ))}
        </div>

        {/* Custom tip input */}
        {selectedTip === 'custom' && (
          <div className="mt-4">
            <Input
              type="number"
              label="Custom Tip Amount"
              placeholder="Enter amount"
              min={0}
              step={0.01}
              value={customTipAmount || ''}
              onChange={(e) => onCustomTipChange(parseFloat(e.target.value) || 0)}
              className="max-w-[200px]"
            />
          </div>
        )}

        {/* Selected tip display */}
        {tipAmount > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-success-600" />
            <span className="text-gray-600">
              Tip: <span className="font-semibold text-gray-900">{formatCurrency(tipAmount)}</span>
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
