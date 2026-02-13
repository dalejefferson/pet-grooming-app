import { format, parseISO } from 'date-fns'
import type { Appointment, Client, Service, Pet, Groomer } from '@/modules/database/types'

export function exportReportCsv(
  filteredAppointments: Appointment[],
  clients: Client[],
  services: Service[],
  pets: Pet[],
  groomers: Groomer[]
): void {
  const headers = [
    'Date',
    'Time',
    'End Time',
    'Client',
    'Client Email',
    'Client Phone',
    'Pet Name',
    'Species',
    'Breed',
    'Weight Range',
    'Coat Type',
    'Service',
    'Service Category',
    'Duration (min)',
    'Service Price',
    'Groomer',
    'Status',
    'Appointment Total',
    'Deposit Paid',
    'Deposit Amount',
    'Tip',
    'Payment Status',
    'Notes',
  ]
  const rows: string[][] = []

  filteredAppointments.forEach((apt) => {
    const client = clients.find((c) => c.id === apt.clientId)
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown'
    const clientEmail = client?.email || ''
    const clientPhone = client?.phone || ''
    const date = format(parseISO(apt.startTime), 'yyyy-MM-dd')
    const startTime = format(parseISO(apt.startTime), 'h:mm a')
    const endTime = format(parseISO(apt.endTime), 'h:mm a')
    const groomer = apt.groomerId ? groomers.find((g) => g.id === apt.groomerId) : null
    const groomerName = groomer ? `${groomer.firstName} ${groomer.lastName}` : ''
    const notes = [apt.internalNotes, apt.clientNotes].filter(Boolean).join(' | ')

    apt.pets.forEach((petData) => {
      const pet = pets.find((p) => p.id === petData.petId)
      const petName = pet?.name || 'Unknown'
      const species = pet?.species || ''
      const breed = pet?.breed || ''
      const weightRange = pet?.weightRange || ''
      const coatType = pet?.coatType || ''

      petData.services.forEach((service) => {
        const svc = services.find((s) => s.id === service.serviceId)
        rows.push([
          date,
          startTime,
          endTime,
          clientName,
          clientEmail,
          clientPhone,
          petName,
          species,
          breed,
          weightRange,
          coatType,
          svc?.name || 'Unknown',
          svc?.category || '',
          String(service.finalDuration),
          service.finalPrice.toFixed(2),
          groomerName,
          apt.status,
          apt.totalAmount.toFixed(2),
          apt.depositPaid ? 'Yes' : 'No',
          apt.depositAmount ? apt.depositAmount.toFixed(2) : '0.00',
          apt.tipAmount ? apt.tipAmount.toFixed(2) : '0.00',
          apt.paymentStatus || 'pending',
          notes,
        ])
      })
    })
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `grooming-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
