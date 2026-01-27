import { CreditCard, Check, AlertCircle, Lock } from 'lucide-react'
import { Card, CardTitle } from '@/components/common'
import type { PaymentStatus } from '@/types'

interface PaymentFormProps {
  paymentStatus: PaymentStatus
}

export function PaymentForm({ paymentStatus }: PaymentFormProps) {
  return (
    <Card className="border-[#1e293b] bg-white">
      <CardTitle className="flex items-center gap-2">
        <Lock className="h-5 w-5" />
        Payment
      </CardTitle>
      <p className="mt-1 text-sm text-gray-500">Secure payment processing</p>

      {paymentStatus === 'completed' ? (
        <div className="mt-4 rounded-xl border-2 border-success-500 bg-success-50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-500">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-success-900">Payment Successful!</p>
              <p className="text-sm text-success-700">Your booking is being confirmed...</p>
            </div>
          </div>
        </div>
      ) : paymentStatus === 'failed' ? (
        <div className="mt-4 rounded-xl border-2 border-danger-500 bg-danger-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-danger-600" />
            <div>
              <p className="font-semibold text-danger-900">Payment Failed</p>
              <p className="text-sm text-danger-700">Please try again or use a different card.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Mock Card Display */}
          <div className="rounded-xl border-2 border-[#1e293b] bg-gradient-to-br from-[#1e293b] to-[#334155] p-4 text-white shadow-[3px_3px_0px_0px_#64748b]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Credit Card
              </span>
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="mt-4 font-mono text-lg tracking-wider">4242 4242 4242 4242</div>
            <div className="mt-3 flex justify-between text-sm">
              <div>
                <span className="text-xs uppercase tracking-wider opacity-60">Expiry</span>
                <p className="font-mono">12/25</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider opacity-60">CVC</span>
                <p className="font-mono">123</p>
              </div>
            </div>
          </div>

          {/* Mock card inputs (read-only display) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-semibold text-[#1e293b]">
                Card Number
              </label>
              <div className="rounded-xl border-2 border-[#1e293b] bg-gray-100 px-3 py-2 text-gray-600">
                4242 4242 4242 4242
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1e293b]">Expiry</label>
              <div className="rounded-xl border-2 border-[#1e293b] bg-gray-100 px-3 py-2 text-gray-600">
                12/25
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1e293b]">CVC</label>
              <div className="rounded-xl border-2 border-[#1e293b] bg-gray-100 px-3 py-2 text-gray-600">
                123
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
