import { jsPDF } from 'jspdf'
import { format, parseISO } from 'date-fns'
import type { Appointment, Client, Service } from '@/modules/database/types'
import type {
  DateRange,
  RevenueDataPoint,
  StatusDataPoint,
  TopServiceDataPoint,
  ClientAcquisitionDataPoint,
  ReportStats,
} from '@/modules/ui/components/reports/types'
import { PASTEL_COLORS } from '@/modules/ui/components/reports/types'

interface ExportPdfParams {
  dateRange: DateRange
  startDate: Date
  today: Date
  filteredAppointments: Appointment[]
  clients: Client[]
  services: Service[]
  stats: ReportStats
  revenueData: RevenueDataPoint[]
  statusData: StatusDataPoint[]
  topServicesData: TopServiceDataPoint[]
  clientAcquisitionData: ClientAcquisitionDataPoint[]
}

const PDF_COLORS = {
  dark: '#1e293b',
  mint: '#d1fae5',
  mintDark: '#059669',
  yellow: '#fef9c3',
  lavender: '#e9d5ff',
  lavenderDark: '#8b5cf6',
  pink: '#fce7f3',
  blue: '#dbeafe',
  peach: '#fed7aa',
  gray: '#334155',
  lightGray: '#e2e8f0',
}

function drawRoundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: string,
  strokeColor?: string
): void {
  doc.setFillColor(fillColor)
  if (strokeColor) {
    doc.setDrawColor(strokeColor)
    doc.setLineWidth(0.5)
  }
  doc.roundedRect(x, y, w, h, r, r, strokeColor ? 'FD' : 'F')
}

function drawBarChart(
  doc: jsPDF,
  data: { label: string; value: number; color: string }[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
): void {
  drawRoundedRect(doc, x, y, width, height, 3, '#ffffff', PDF_COLORS.dark)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text(title, x + 8, y + 12)

  if (data.length === 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(PDF_COLORS.gray)
    doc.text('No data available', x + width / 2, y + height / 2, { align: 'center' })
    return
  }

  const chartStartY = y + 20
  const chartHeight = height - 35
  const barAreaWidth = width - 50
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const barWidth = Math.min((barAreaWidth - (data.length - 1) * 4) / data.length, 25)
  const startX = x + 40

  doc.setDrawColor(PDF_COLORS.lightGray)
  doc.setLineWidth(0.3)
  doc.line(x + 35, chartStartY, x + 35, chartStartY + chartHeight)

  const gridLines = 4
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  for (let i = 0; i <= gridLines; i++) {
    const lineY = chartStartY + (chartHeight * i) / gridLines
    doc.setDrawColor(PDF_COLORS.lightGray)
    doc.line(x + 35, lineY, x + width - 8, lineY)
    const value = Math.round(maxValue * (1 - i / gridLines))
    doc.text(value.toString(), x + 32, lineY + 2, { align: 'right' })
  }

  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight
    const barX = startX + index * (barWidth + 4)
    const barY = chartStartY + chartHeight - barHeight

    doc.setFillColor(item.color)
    doc.setDrawColor(PDF_COLORS.dark)
    doc.setLineWidth(0.5)
    if (barHeight > 4) {
      doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'FD')
    } else if (barHeight > 0) {
      doc.rect(barX, barY, barWidth, barHeight, 'FD')
    }

    doc.setFontSize(6)
    doc.setTextColor(PDF_COLORS.dark)
    const label = item.label.length > 8 ? item.label.substring(0, 7) + '...' : item.label
    doc.text(label, barX + barWidth / 2, chartStartY + chartHeight + 6, { align: 'center' })
  })
}

function drawHorizontalBarChart(
  doc: jsPDF,
  data: { label: string; value: number; color: string }[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
): void {
  drawRoundedRect(doc, x, y, width, height, 3, '#ffffff', PDF_COLORS.dark)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text(title, x + 8, y + 12)

  if (data.length === 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(PDF_COLORS.gray)
    doc.text('No data available', x + width / 2, y + height / 2, { align: 'center' })
    return
  }

  const chartStartY = y + 20
  const chartStartX = x + 50
  const chartWidth = width - 60
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const barHeight = Math.min((height - 30) / data.length - 4, 12)

  data.forEach((item, index) => {
    const barWidthCalc = (item.value / maxValue) * chartWidth
    const barY = chartStartY + index * (barHeight + 4)

    doc.setFontSize(7)
    doc.setTextColor(PDF_COLORS.dark)
    const label = item.label.length > 12 ? item.label.substring(0, 11) + '...' : item.label
    doc.text(label, chartStartX - 4, barY + barHeight / 2 + 2, { align: 'right' })

    if (barWidthCalc > 0) {
      doc.setFillColor(item.color)
      doc.setDrawColor(PDF_COLORS.dark)
      doc.setLineWidth(0.5)
      doc.roundedRect(chartStartX, barY, Math.max(barWidthCalc, 4), barHeight, 2, 2, 'FD')
    }

    doc.setFontSize(7)
    doc.setTextColor(PDF_COLORS.gray)
    doc.text(item.value.toString(), chartStartX + barWidthCalc + 4, barY + barHeight / 2 + 2)
  })
}

export function exportReportPdf(params: ExportPdfParams): void {
  const {
    dateRange,
    startDate,
    today,
    filteredAppointments,
    clients,
    services,
    stats,
    revenueData,
    statusData,
    topServicesData,
    clientAcquisitionData,
  } = params

  const { totalRevenue, totalAppointments, completedAppointments } = stats

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  // ===== PAGE 1: Header and Summary =====

  drawRoundedRect(doc, 0, 0, pageWidth, 55, 0, PDF_COLORS.mint)

  doc.setFillColor(PDF_COLORS.yellow)
  doc.circle(pageWidth - 25, 25, 15, 'F')
  doc.setFillColor(PDF_COLORS.lavender)
  doc.circle(pageWidth - 50, 15, 8, 'F')

  drawRoundedRect(doc, margin + 2, 12 + 2, 140, 30, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin, 12, 140, 30, 4, '#ffffff', PDF_COLORS.dark)

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text('Grooming Business Report', margin + 8, 32)

  yPos = 65

  const dateRangeText = `${format(startDate, 'MMM d, yyyy')} - ${format(today, 'MMM d, yyyy')}`
  drawRoundedRect(doc, margin + 2, yPos + 2, pageWidth - 2 * margin, 20, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin, yPos, pageWidth - 2 * margin, 20, 4, PDF_COLORS.yellow, PDF_COLORS.dark)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text(`Report Period: ${dateRange.label}`, margin + 10, yPos + 12)
  doc.setFont('helvetica', 'normal')
  doc.text(dateRangeText, pageWidth - margin - 10, yPos + 12, { align: 'right' })

  yPos += 35

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text('Summary Statistics', margin, yPos)
  yPos += 10

  const cardWidth = (pageWidth - 2 * margin - 15) / 2
  const cardHeight = 35

  // Card 1: Total Revenue
  drawRoundedRect(doc, margin + 2, yPos + 2, cardWidth, cardHeight, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin, yPos, cardWidth, cardHeight, 4, PDF_COLORS.mint, PDF_COLORS.dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`$${totalRevenue.toFixed(0)}`, margin + 10, yPos + 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  doc.text('Total Revenue', margin + 10, yPos + 28)

  // Card 2: Total Appointments
  drawRoundedRect(doc, margin + cardWidth + 17, yPos + 2, cardWidth, cardHeight, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin + cardWidth + 15, yPos, cardWidth, cardHeight, 4, PDF_COLORS.yellow, PDF_COLORS.dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text(totalAppointments.toString(), margin + cardWidth + 25, yPos + 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  doc.text('Total Appointments', margin + cardWidth + 25, yPos + 28)

  yPos += cardHeight + 10

  // Card 3: Completed Appointments
  drawRoundedRect(doc, margin + 2, yPos + 2, cardWidth, cardHeight, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin, yPos, cardWidth, cardHeight, 4, PDF_COLORS.lavender, PDF_COLORS.dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text(completedAppointments.toString(), margin + 10, yPos + 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  doc.text('Completed', margin + 10, yPos + 28)

  // Card 4: Total Clients
  drawRoundedRect(doc, margin + cardWidth + 17, yPos + 2, cardWidth, cardHeight, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin + cardWidth + 15, yPos, cardWidth, cardHeight, 4, PDF_COLORS.pink, PDF_COLORS.dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text(clients.length.toString(), margin + cardWidth + 25, yPos + 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  doc.text('Total Clients', margin + cardWidth + 25, yPos + 28)

  yPos += cardHeight + 20

  // ===== CHARTS SECTION =====

  const statusChartData = statusData.map((item) => ({
    label: item.status,
    value: item.count,
    color: item.fill,
  }))

  const chartWidth = (pageWidth - 2 * margin - 10) / 2
  const chartHeightVal = 75

  drawBarChart(doc, statusChartData, margin, yPos, chartWidth, chartHeightVal, 'Appointments by Status')

  const topServicesChartData = topServicesData.map((item, index) => ({
    label: item.name,
    value: item.count,
    color: Object.values(PASTEL_COLORS)[index % Object.values(PASTEL_COLORS).length],
  }))

  drawHorizontalBarChart(doc, topServicesChartData, margin + chartWidth + 10, yPos, chartWidth, chartHeightVal, 'Top Services')

  yPos += chartHeightVal + 15

  // ===== PAGE 2: Detailed Charts =====
  doc.addPage()
  yPos = margin

  drawRoundedRect(doc, 0, 0, pageWidth, 30, 0, PDF_COLORS.blue)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text('Detailed Analytics', margin, 20)

  yPos = 45

  // Revenue Trend Chart
  const revenueChartHeight = 80
  drawRoundedRect(doc, margin + 2, yPos + 2, pageWidth - 2 * margin, revenueChartHeight, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin, yPos, pageWidth - 2 * margin, revenueChartHeight, 4, '#ffffff', PDF_COLORS.dark)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text('Revenue Over Time', margin + 10, yPos + 15)

  const chartAreaX = margin + 25
  const chartAreaY = yPos + 25
  const chartAreaWidth = pageWidth - 2 * margin - 35
  const chartAreaHeight = revenueChartHeight - 40

  const sampleSize = Math.max(1, Math.floor(revenueData.length / 15))
  const sampledRevenueData = revenueData.filter((_, i) => i % sampleSize === 0 || i === revenueData.length - 1)
  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1)

  if (sampledRevenueData.length > 1) {
    doc.setDrawColor(PDF_COLORS.lightGray)
    doc.setLineWidth(0.2)
    for (let i = 0; i <= 4; i++) {
      const gridY = chartAreaY + (chartAreaHeight * i) / 4
      doc.line(chartAreaX, gridY, chartAreaX + chartAreaWidth, gridY)

      const value = Math.round(maxRevenue * (1 - i / 4))
      doc.setFontSize(6)
      doc.setTextColor(PDF_COLORS.gray)
      doc.text(`$${value}`, chartAreaX - 3, gridY + 2, { align: 'right' })
    }

    doc.setDrawColor(PDF_COLORS.mintDark)
    doc.setLineWidth(1.5)

    let prevX = 0,
      prevY = 0
    sampledRevenueData.forEach((point, index) => {
      const x = chartAreaX + (index / (sampledRevenueData.length - 1)) * chartAreaWidth
      const y = chartAreaY + chartAreaHeight - (point.revenue / maxRevenue) * chartAreaHeight

      if (index > 0) {
        doc.line(prevX, prevY, x, y)
      }

      doc.setFillColor(PDF_COLORS.mint)
      doc.setDrawColor(PDF_COLORS.mintDark)
      doc.circle(x, y, 2, 'FD')

      prevX = x
      prevY = y
    })

    doc.setFontSize(6)
    doc.setTextColor(PDF_COLORS.gray)
    if (sampledRevenueData.length > 0) {
      doc.text(sampledRevenueData[0].date, chartAreaX, chartAreaY + chartAreaHeight + 8)
      if (sampledRevenueData.length > 2) {
        const midIndex = Math.floor(sampledRevenueData.length / 2)
        doc.text(sampledRevenueData[midIndex].date, chartAreaX + chartAreaWidth / 2, chartAreaY + chartAreaHeight + 8, {
          align: 'center',
        })
      }
      doc.text(sampledRevenueData[sampledRevenueData.length - 1].date, chartAreaX + chartAreaWidth, chartAreaY + chartAreaHeight + 8, {
        align: 'right',
      })
    }
  } else {
    doc.setFontSize(10)
    doc.setTextColor(PDF_COLORS.gray)
    doc.text('No revenue data available', margin + (pageWidth - 2 * margin) / 2, yPos + revenueChartHeight / 2, { align: 'center' })
  }

  yPos += revenueChartHeight + 15

  // Client Acquisition Chart
  const clientChartHeight = 70
  drawRoundedRect(doc, margin + 2, yPos + 2, pageWidth - 2 * margin, clientChartHeight, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin, yPos, pageWidth - 2 * margin, clientChartHeight, 4, '#ffffff', PDF_COLORS.dark)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text('New Clients Over Time', margin + 10, yPos + 15)

  const clientChartAreaY = yPos + 22
  const clientChartAreaHeight = clientChartHeight - 35
  const sampledClientData = clientAcquisitionData.filter((_, i) => i % sampleSize === 0 || i === clientAcquisitionData.length - 1)
  const maxClients = Math.max(...clientAcquisitionData.map((d) => d.clients), 1)

  if (sampledClientData.length > 0) {
    const barWidthCalc = Math.min((chartAreaWidth - (sampledClientData.length - 1) * 2) / sampledClientData.length, 15)

    sampledClientData.forEach((point, index) => {
      const x = chartAreaX + index * (barWidthCalc + 2) + (chartAreaWidth - sampledClientData.length * (barWidthCalc + 2)) / 2
      const barHeightVal = (point.clients / maxClients) * clientChartAreaHeight
      const y = clientChartAreaY + clientChartAreaHeight - barHeightVal

      if (barHeightVal > 0) {
        doc.setFillColor(PDF_COLORS.lavender)
        doc.setDrawColor(PDF_COLORS.dark)
        doc.setLineWidth(0.3)
        doc.roundedRect(x, y, barWidthCalc, barHeightVal, 1, 1, 'FD')
      }
    })
  }

  yPos += clientChartHeight + 15

  // ===== Data Table Section =====
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text('Recent Appointments Summary', margin, yPos)
  yPos += 8

  const colWidths = [35, 45, 40, 30, 25]
  const tableWidth = colWidths.reduce((a, b) => a + b, 0)
  const rowHeight = 8

  drawRoundedRect(doc, margin, yPos, tableWidth, rowHeight, 2, PDF_COLORS.mint, PDF_COLORS.dark)

  const headers = ['Date', 'Client', 'Service', 'Status', 'Amount']
  let xPos = margin + 3
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPos + 5.5)
    xPos += colWidths[i]
  })

  yPos += rowHeight

  const recentAppointments = [...filteredAppointments]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)

  recentAppointments.forEach((apt, rowIndex) => {
    const client = clients.find((c) => c.id === apt.clientId)
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown'
    const date = format(parseISO(apt.startTime), 'MMM d, HH:mm')

    let serviceName = 'Multiple'
    if (apt.pets.length > 0 && apt.pets[0].services.length > 0) {
      const svc = services.find((s) => s.id === apt.pets[0].services[0].serviceId)
      serviceName = svc?.name || 'Unknown'
    }

    const rowColor = rowIndex % 2 === 0 ? '#ffffff' : PDF_COLORS.lightGray
    doc.setFillColor(rowColor)
    doc.rect(margin, yPos, tableWidth, rowHeight, 'F')
    doc.setDrawColor(PDF_COLORS.lightGray)
    doc.line(margin, yPos + rowHeight, margin + tableWidth, yPos + rowHeight)

    xPos = margin + 3
    doc.setTextColor(PDF_COLORS.dark)

    const rowData = [
      date,
      clientName.length > 15 ? clientName.substring(0, 14) + '...' : clientName,
      serviceName.length > 12 ? serviceName.substring(0, 11) + '...' : serviceName,
      apt.status.replace('_', ' '),
      `$${apt.totalAmount.toFixed(0)}`,
    ]

    rowData.forEach((cell, i) => {
      doc.text(cell, xPos, yPos + 5.5)
      xPos += colWidths[i]
    })

    yPos += rowHeight

    if (yPos > pageHeight - 30) {
      doc.addPage()
      yPos = margin
    }
  })

  // Footer on last page
  yPos = pageHeight - 20
  doc.setDrawColor(PDF_COLORS.dark)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  doc.text(`Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, margin, yPos)
  doc.text('Pet Grooming Business Report', pageWidth - margin, yPos, { align: 'right' })

  doc.save(`grooming-report-${format(today, 'yyyy-MM-dd')}.pdf`)
}
