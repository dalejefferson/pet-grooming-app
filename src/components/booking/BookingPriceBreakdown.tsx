import { Card, CardTitle } from '@/components/common'
import { formatCurrency } from '@/lib/utils'

interface BookingPriceBreakdownProps {
  totalPrice: number
  tipAmount: number
  depositRequired: number
  grandTotal: number
}

export function BookingPriceBreakdown({
  totalPrice,
  tipAmount,
  depositRequired,
  grandTotal,
}: BookingPriceBreakdownProps) {
  return (
    <Card>
      <CardTitle>Pricing Summary</CardTitle>
      <div className="mt-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal (Services)</span>
          <span className="text-gray-900">{formatCurrency(totalPrice)}</span>
        </div>
        {tipAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Tip</span>
            <span className="text-gray-900">{formatCurrency(tipAmount)}</span>
          </div>
        )}
        {depositRequired > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Deposit Required</span>
            <span className="text-warning-600">{formatCurrency(depositRequired)}</span>
          </div>
        )}
        <div className="border-t-2 border-[#1e293b] pt-3">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-[#1e293b]">Total</span>
            <span className="text-[#1e293b]">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
