import { format, parseISO } from 'date-fns'
import type { Appointment, Client, Service } from '@/types'

export function exportReportCsv(
  filteredAppointments: Appointment[],
  clients: Client[],
  services: Service[]
): void {
  const headers = ['Date', 'Client', 'Pet', 'Service', 'Status', 'Amount']
  const rows: string[][] = []

  filteredAppointments.forEach((apt) => {
    const client = clients.find((c) => c.id === apt.clientId)
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown'
    const date = format(parseISO(apt.startTime), 'yyyy-MM-dd HH:mm')

    apt.pets.forEach((petData) => {
      petData.services.forEach((service) => {
        const svc = services.find((s) => s.id === service.serviceId)
        rows.push([
          date,
          clientName,
          petData.petId,
          svc?.name || 'Unknown',
          apt.status,
          service.finalPrice.toFixed(2),
        ])
      })
    })
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'appointments-report.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}
