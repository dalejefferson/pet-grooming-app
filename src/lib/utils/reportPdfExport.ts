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
  GroomerPerformanceDataPoint,
  ClientRetentionDataPoint,
  NoShowCancellationData,
  PeakHoursData,
  ServiceCategoryDataPoint,
} from '@/modules/ui/components/reports/types'
import type { ThemeColors } from '@/modules/ui/context/ThemeContext'

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
  groomerPerformanceData: GroomerPerformanceDataPoint[]
  clientRetentionData: ClientRetentionDataPoint[]
  noShowCancellationData: NoShowCancellationData
  peakHoursData: PeakHoursData
  serviceCategoryRevenueData: ServiceCategoryDataPoint[]
  themeColors: ThemeColors
}

const PDF_COLORS = {
  dark: '#1e293b',
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
    groomerPerformanceData,
    clientRetentionData,
    noShowCancellationData,
    peakHoursData,
    serviceCategoryRevenueData,
    themeColors,
  } = params

  const { totalRevenue, totalAppointments, completedAppointments, cancelledAppointments, noShowAppointments } = stats

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  // ===== PAGE 1: Header and Summary =====

  drawRoundedRect(doc, 0, 0, pageWidth, 55, 0, themeColors.accentColor)

  doc.setFillColor(themeColors.secondaryAccent)
  doc.circle(pageWidth - 25, 25, 15, 'F')
  doc.setFillColor(themeColors.accentColorDark)
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
  drawRoundedRect(doc, margin, yPos, pageWidth - 2 * margin, 20, 4, themeColors.secondaryAccent, PDF_COLORS.dark)

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
  drawRoundedRect(doc, margin, yPos, cardWidth, cardHeight, 4, themeColors.accentColor, PDF_COLORS.dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`$${totalRevenue.toFixed(0)}`, margin + 10, yPos + 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  doc.text('Total Revenue', margin + 10, yPos + 28)

  // Card 2: Total Appointments
  drawRoundedRect(doc, margin + cardWidth + 17, yPos + 2, cardWidth, cardHeight, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin + cardWidth + 15, yPos, cardWidth, cardHeight, 4, themeColors.secondaryAccent, PDF_COLORS.dark)
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
  drawRoundedRect(doc, margin, yPos, cardWidth, cardHeight, 4, themeColors.accentColorDark, PDF_COLORS.dark)
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
  drawRoundedRect(doc, margin + cardWidth + 15, yPos, cardWidth, cardHeight, 4, themeColors.accentColorLight, PDF_COLORS.dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text(clients.length.toString(), margin + cardWidth + 25, yPos + 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  doc.text('Total Clients', margin + cardWidth + 25, yPos + 28)

  yPos += cardHeight + 10

  // Card 5: Cancelled Appointments
  drawRoundedRect(doc, margin + 2, yPos + 2, cardWidth, cardHeight, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin, yPos, cardWidth, cardHeight, 4, themeColors.gradientVia, PDF_COLORS.dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text(cancelledAppointments.toString(), margin + 10, yPos + 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  doc.text('Cancelled', margin + 10, yPos + 28)

  // Card 6: No-Show Appointments
  drawRoundedRect(doc, margin + cardWidth + 17, yPos + 2, cardWidth, cardHeight, 4, PDF_COLORS.dark)
  drawRoundedRect(doc, margin + cardWidth + 15, yPos, cardWidth, cardHeight, 4, themeColors.gradientTo, PDF_COLORS.dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text(noShowAppointments.toString(), margin + cardWidth + 25, yPos + 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  doc.text('No Shows', margin + cardWidth + 25, yPos + 28)

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

  const themeChartColors = [
    themeColors.accentColor,
    themeColors.secondaryAccent,
    themeColors.accentColorDark,
    themeColors.accentColorLight,
    themeColors.gradientVia,
    themeColors.gradientTo,
  ]
  const topServicesChartData = topServicesData.map((item, index) => ({
    label: item.name,
    value: item.count,
    color: themeChartColors[index % themeChartColors.length],
  }))

  drawHorizontalBarChart(doc, topServicesChartData, margin + chartWidth + 10, yPos, chartWidth, chartHeightVal, 'Top Services')

  yPos += chartHeightVal + 15

  // ===== PAGE 2: Detailed Charts =====
  doc.addPage()
  yPos = margin

  drawRoundedRect(doc, 0, 0, pageWidth, 30, 0, themeColors.accentColorLight)
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

    doc.setDrawColor(themeColors.accentColorDark)
    doc.setLineWidth(1.5)

    let prevX = 0,
      prevY = 0
    sampledRevenueData.forEach((point, index) => {
      const x = chartAreaX + (index / (sampledRevenueData.length - 1)) * chartAreaWidth
      const y = chartAreaY + chartAreaHeight - (point.revenue / maxRevenue) * chartAreaHeight

      if (index > 0) {
        doc.line(prevX, prevY, x, y)
      }

      doc.setFillColor(themeColors.accentColor)
      doc.setDrawColor(themeColors.accentColorDark)
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
        doc.setFillColor(themeColors.gradientVia)
        doc.setDrawColor(PDF_COLORS.dark)
        doc.setLineWidth(0.3)
        doc.roundedRect(x, y, barWidthCalc, barHeightVal, 1, 1, 'FD')
      }
    })
  }

  yPos += clientChartHeight + 15

  // ===== Groomer Performance Chart =====
  const groomerChartHeight = 75
  if (yPos + groomerChartHeight > pageHeight - 30) {
    doc.addPage()
    yPos = margin
  }
  const groomerChartData = groomerPerformanceData.map((item, index) => ({
    label: item.name,
    value: Math.round(item.revenue),
    color: themeChartColors[index % themeChartColors.length],
  }))
  drawHorizontalBarChart(doc, groomerChartData, margin, yPos, pageWidth - 2 * margin, groomerChartHeight, 'Groomer Performance (Revenue)')

  yPos += groomerChartHeight + 15

  // ===== No-Shows & Cancellations Chart =====
  const noShowChartHeight = 80
  if (yPos + noShowChartHeight > pageHeight - 30) {
    doc.addPage()
    yPos = margin
  }
  const noShowBarData = [
    { label: 'Completed', value: noShowCancellationData.completedCount, color: themeColors.accentColorDark },
    { label: 'Cancelled', value: noShowCancellationData.cancelledCount, color: themeColors.secondaryAccent },
    { label: 'No Shows', value: noShowCancellationData.noShowCount, color: themeColors.gradientTo },
  ]
  drawBarChart(doc, noShowBarData, margin, yPos, (pageWidth - 2 * margin - 10) / 2, noShowChartHeight, 'No-Shows & Cancellations')

  // Rates & Lost Revenue info box
  const infoBoxX = margin + (pageWidth - 2 * margin - 10) / 2 + 10
  const infoBoxWidth = (pageWidth - 2 * margin - 10) / 2
  drawRoundedRect(doc, infoBoxX + 2, yPos + 2, infoBoxWidth, noShowChartHeight, 3, PDF_COLORS.dark)
  drawRoundedRect(doc, infoBoxX, yPos, infoBoxWidth, noShowChartHeight, 3, '#ffffff', PDF_COLORS.dark)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text('Impact Summary', infoBoxX + 8, yPos + 14)

  const noShowRate = noShowCancellationData.totalAppointments > 0
    ? ((noShowCancellationData.noShowCount / noShowCancellationData.totalAppointments) * 100).toFixed(1)
    : '0.0'
  const cancelRate = noShowCancellationData.totalAppointments > 0
    ? ((noShowCancellationData.cancelledCount / noShowCancellationData.totalAppointments) * 100).toFixed(1)
    : '0.0'

  const infoItems = [
    { label: 'No-Show Rate', value: `${noShowRate}%` },
    { label: 'Cancellation Rate', value: `${cancelRate}%` },
    { label: 'Est. Lost Revenue', value: `$${noShowCancellationData.estimatedLostRevenue.toFixed(0)}` },
  ]
  infoItems.forEach((item, idx) => {
    const itemY = yPos + 28 + idx * 16
    drawRoundedRect(doc, infoBoxX + 8, itemY, infoBoxWidth - 16, 12, 2, themeColors.accentColor)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(PDF_COLORS.dark)
    doc.text(item.value, infoBoxX + 14, itemY + 8)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(PDF_COLORS.gray)
    doc.text(item.label, infoBoxX + infoBoxWidth - 14, itemY + 8, { align: 'right' })
  })

  yPos += noShowChartHeight + 15

  // ===== Client Retention Chart =====
  const retentionChartHeight = 60
  if (yPos + retentionChartHeight > pageHeight - 30) {
    doc.addPage()
    yPos = margin
  }
  const retentionChartData = clientRetentionData.map((item, index) => ({
    label: item.name,
    value: item.value,
    color: index === 0 ? themeColors.accentColor : themeColors.accentColorDark,
  }))
  drawBarChart(doc, retentionChartData, margin, yPos, (pageWidth - 2 * margin - 10) / 2, retentionChartHeight, 'Client Retention')

  // Service Category Revenue Chart (beside retention)
  const svcCatChartData = serviceCategoryRevenueData.map((item, index) => ({
    label: item.category,
    value: Math.round(item.revenue),
    color: themeChartColors[index % themeChartColors.length],
  }))
  drawHorizontalBarChart(doc, svcCatChartData, margin + (pageWidth - 2 * margin - 10) / 2 + 10, yPos, (pageWidth - 2 * margin - 10) / 2, retentionChartHeight, 'Revenue by Category')

  yPos += retentionChartHeight + 15

  // ===== Peak Hours Heatmap =====
  const heatmapHeight = 80
  if (yPos + heatmapHeight > pageHeight - 30) {
    doc.addPage()
    yPos = margin
  }
  const heatmapWidth = pageWidth - 2 * margin
  drawRoundedRect(doc, margin + 2, yPos + 2, heatmapWidth, heatmapHeight, 3, PDF_COLORS.dark)
  drawRoundedRect(doc, margin, yPos, heatmapWidth, heatmapHeight, 3, '#ffffff', PDF_COLORS.dark)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text('Peak Hours', margin + 8, yPos + 12)

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const heatStartX = margin + 28
  const heatStartY = yPos + 18
  const cellW = (heatmapWidth - 36) / 11 // 11 hours (8-18)
  const cellH = (heatmapHeight - 28) / 7  // 7 days

  // Hour labels
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(PDF_COLORS.gray)
  for (let hour = 8; hour <= 18; hour++) {
    const label = hour <= 12 ? `${hour}${hour < 12 ? 'a' : 'p'}` : `${hour - 12}p`
    doc.text(label, heatStartX + (hour - 8) * cellW + cellW / 2, heatStartY - 2, { align: 'center' })
  }

  // Day labels and cells
  dayLabels.forEach((day, dayIdx) => {
    doc.setFontSize(6)
    doc.setTextColor(PDF_COLORS.gray)
    doc.text(day, heatStartX - 4, heatStartY + dayIdx * cellH + cellH / 2 + 2, { align: 'right' })

    for (let hour = 8; hour <= 18; hour++) {
      const count = peakHoursData.grid[`${dayIdx}-${hour}`] || 0
      const intensity = peakHoursData.maxCount > 0 ? count / peakHoursData.maxCount : 0

      // Blend from white to theme accent based on intensity
      const r1 = 255, g1 = 255, b1 = 255
      const hex = themeColors.accentColorDark
      const r2 = parseInt(hex.slice(1, 3), 16)
      const g2 = parseInt(hex.slice(3, 5), 16)
      const b2 = parseInt(hex.slice(5, 7), 16)
      const r = Math.round(r1 + (r2 - r1) * intensity)
      const g = Math.round(g1 + (g2 - g1) * intensity)
      const b = Math.round(b1 + (b2 - b1) * intensity)

      const cx = heatStartX + (hour - 8) * cellW
      const cy = heatStartY + dayIdx * cellH
      doc.setFillColor(r, g, b)
      doc.setDrawColor(PDF_COLORS.lightGray)
      doc.setLineWidth(0.2)
      doc.rect(cx, cy, cellW, cellH, 'FD')

      if (count > 0) {
        doc.setFontSize(5)
        doc.setTextColor(intensity > 0.5 ? '#ffffff' : PDF_COLORS.dark)
        doc.text(count.toString(), cx + cellW / 2, cy + cellH / 2 + 1.5, { align: 'center' })
      }
    }
  })

  yPos += heatmapHeight + 15

  // ===== Data Table Section =====
  if (yPos + 100 > pageHeight - 30) {
    doc.addPage()
    yPos = margin
  }
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(PDF_COLORS.dark)
  doc.text('Recent Appointments Summary', margin, yPos)
  yPos += 8

  const colWidths = [35, 45, 40, 30, 25]
  const tableWidth = colWidths.reduce((a, b) => a + b, 0)
  const rowHeight = 8

  drawRoundedRect(doc, margin, yPos, tableWidth, rowHeight, 2, themeColors.accentColor, PDF_COLORS.dark)

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
