import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/common'

export function NewClientNotice() {
  return (
    <Card className="border-primary-200 bg-primary-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-primary-600" />
        <div>
          <h3 className="font-medium text-primary-900">New Client Booking</h3>
          <p className="mt-1 text-sm text-primary-800">
            As a new client, your booking will be submitted as a request. We'll contact you
            to confirm your appointment within 24 hours.
          </p>
        </div>
      </div>
    </Card>
  )
}
