import { Card, CardTitle } from '../common'

interface ClientInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface ClientInfoCardProps {
  clientInfo: ClientInfo
}

export function ClientInfoCard({ clientInfo }: ClientInfoCardProps) {
  return (
    <Card>
      <CardTitle>Your Information</CardTitle>
      <div className="mt-4 space-y-2">
        <p className="text-gray-900">
          {clientInfo.firstName} {clientInfo.lastName}
        </p>
        <p className="text-gray-600">{clientInfo.email}</p>
        <p className="text-gray-600">{clientInfo.phone}</p>
      </div>
    </Card>
  )
}
