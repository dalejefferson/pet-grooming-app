import { useState, useMemo } from 'react'
import { Download, Calendar, TrendingUp, Users, Scissors, FileText } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardTitle, Button } from '@/components/common'
import { useAppointments, useClients, useServices } from '@/hooks'
import { format, subDays, parseISO, isWithinInterval, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'
import { useTheme } from '@/context/ThemeContext'
import { jsPDF } from 'jspdf'

const PASTEL_COLORS = {
  mint: '#d1fae5',
  yellow: '#fef9c3',
  lavender: '#e9d5ff',
  pink: '#fce7f3',
  blue: '#dbeafe',
  peach: '#fed7aa',
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  requested: PASTEL_COLORS.yellow,
  confirmed: PASTEL_COLORS.blue,
  checked_in: PASTEL_COLORS.lavender,
  in_progress: PASTEL_COLORS.mint,
  completed: '#86efac',
  cancelled: PASTEL_COLORS.pink,
  no_show: PASTEL_COLORS.peach,
}

interface DateRange {
  label: string
  days: number
}

const DATE_RANGES: DateRange[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

export function ReportsPage() {
  const { colors } = useTheme()
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES[2]) // Default to 30 days
  const { data: appointments = [] } = useAppointments()
  const { data: clients = [] } = useClients()
  const { data: services = [] } = useServices()

  const today = startOfDay(new Date())
  const startDate = subDays(today, dateRange.days)

  // Filter appointments within date range
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.startTime)
      return isWithinInterval(aptDate, { start: startDate, end: today })
    })
  }, [appointments, startDate, today])

  // Revenue over time data
  const revenueData = useMemo(() => {
    const dailyRevenue: Record<string, number> = {}

    // Initialize all days in range
    for (let i = dateRange.days - 1; i >= 0; i--) {
      const date = format(subDays(today, i), 'MMM d')
      dailyRevenue[date] = 0
    }

    // Sum revenue by day
    filteredAppointments
      .filter((apt) => apt.status === 'completed')
      .forEach((apt) => {
        const date = format(parseISO(apt.startTime), 'MMM d')
        if (dailyRevenue[date] !== undefined) {
          dailyRevenue[date] += apt.totalAmount
        }
      })

    return Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue,
    }))
  }, [filteredAppointments, dateRange.days, today])

  // Appointments by status data
  const statusData = useMemo(() => {
    const statusCounts: Record<AppointmentStatus, number> = {
      requested: 0,
      confirmed: 0,
      checked_in: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    }

    filteredAppointments.forEach((apt) => {
      statusCounts[apt.status]++
    })

    return Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        status: status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        count,
        fill: STATUS_COLORS[status as AppointmentStatus],
      }))
  }, [filteredAppointments])

  // Top services data
  const topServicesData = useMemo(() => {
    const serviceCounts: Record<string, number> = {}

    filteredAppointments.forEach((apt) => {
      apt.pets.forEach((pet) => {
        pet.services.forEach((service) => {
          const svc = services.find((s) => s.id === service.serviceId)
          const name = svc?.name || 'Unknown Service'
          serviceCounts[name] = (serviceCounts[name] || 0) + 1
        })
      })
    })

    return Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredAppointments, services])

  // Client acquisition data
  const clientAcquisitionData = useMemo(() => {
    const dailyNewClients: Record<string, number> = {}

    // Initialize all days in range
    for (let i = dateRange.days - 1; i >= 0; i--) {
      const date = format(subDays(today, i), 'MMM d')
      dailyNewClients[date] = 0
    }

    // Count new clients by day
    clients.forEach((client) => {
      const createdDate = parseISO(client.createdAt)
      if (isWithinInterval(createdDate, { start: startDate, end: today })) {
        const date = format(createdDate, 'MMM d')
        if (dailyNewClients[date] !== undefined) {
          dailyNewClients[date]++
        }
      }
    })

    return Object.entries(dailyNewClients).map(([date, count]) => ({
      date,
      clients: count,
    }))
  }, [clients, startDate, today, dateRange.days])

  // CSV Export function
  const handleExportCSV = () => {
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

  // PDF Export function with professional formatting and charts
  const handleExportPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPos = margin

    // Colors matching the pastel neo-brutalist theme
    const pdfColors = {
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

    // Helper function to draw a rounded rectangle
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fillColor: string, strokeColor?: string) => {
      doc.setFillColor(fillColor)
      if (strokeColor) {
        doc.setDrawColor(strokeColor)
        doc.setLineWidth(0.5)
      }
      doc.roundedRect(x, y, w, h, r, r, strokeColor ? 'FD' : 'F')
    }

    // Helper function to draw a bar chart
    const drawBarChart = (
      data: { label: string; value: number; color: string }[],
      x: number,
      y: number,
      width: number,
      height: number,
      title: string
    ) => {
      // Draw chart container
      drawRoundedRect(x, y, width, height, 3, '#ffffff', pdfColors.dark)

      // Title
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(pdfColors.dark)
      doc.text(title, x + 8, y + 12)

      if (data.length === 0) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(pdfColors.gray)
        doc.text('No data available', x + width / 2, y + height / 2, { align: 'center' })
        return
      }

      const chartStartY = y + 20
      const chartHeight = height - 35
      const barAreaWidth = width - 50
      const maxValue = Math.max(...data.map(d => d.value), 1)
      const barWidth = Math.min((barAreaWidth - (data.length - 1) * 4) / data.length, 25)
      const startX = x + 40

      // Draw Y-axis
      doc.setDrawColor(pdfColors.lightGray)
      doc.setLineWidth(0.3)
      doc.line(x + 35, chartStartY, x + 35, chartStartY + chartHeight)

      // Draw horizontal grid lines and labels
      const gridLines = 4
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(pdfColors.gray)
      for (let i = 0; i <= gridLines; i++) {
        const lineY = chartStartY + (chartHeight * i) / gridLines
        doc.setDrawColor(pdfColors.lightGray)
        doc.line(x + 35, lineY, x + width - 8, lineY)
        const value = Math.round(maxValue * (1 - i / gridLines))
        doc.text(value.toString(), x + 32, lineY + 2, { align: 'right' })
      }

      // Draw bars
      data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight
        const barX = startX + index * (barWidth + 4)
        const barY = chartStartY + chartHeight - barHeight

        // Bar with rounded top
        doc.setFillColor(item.color)
        doc.setDrawColor(pdfColors.dark)
        doc.setLineWidth(0.5)
        if (barHeight > 4) {
          doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'FD')
        } else if (barHeight > 0) {
          doc.rect(barX, barY, barWidth, barHeight, 'FD')
        }

        // Label (truncated if needed)
        doc.setFontSize(6)
        doc.setTextColor(pdfColors.dark)
        const label = item.label.length > 8 ? item.label.substring(0, 7) + '...' : item.label
        doc.text(label, barX + barWidth / 2, chartStartY + chartHeight + 6, { align: 'center' })
      })
    }

    // Helper function to draw a horizontal bar chart
    const drawHorizontalBarChart = (
      data: { label: string; value: number; color: string }[],
      x: number,
      y: number,
      width: number,
      height: number,
      title: string
    ) => {
      // Draw chart container
      drawRoundedRect(x, y, width, height, 3, '#ffffff', pdfColors.dark)

      // Title
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(pdfColors.dark)
      doc.text(title, x + 8, y + 12)

      if (data.length === 0) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(pdfColors.gray)
        doc.text('No data available', x + width / 2, y + height / 2, { align: 'center' })
        return
      }

      const chartStartY = y + 20
      const chartStartX = x + 50
      const chartWidth = width - 60
      const maxValue = Math.max(...data.map(d => d.value), 1)
      const barHeight = Math.min((height - 30) / data.length - 4, 12)

      data.forEach((item, index) => {
        const barWidthCalc = (item.value / maxValue) * chartWidth
        const barY = chartStartY + index * (barHeight + 4)

        // Label
        doc.setFontSize(7)
        doc.setTextColor(pdfColors.dark)
        const label = item.label.length > 12 ? item.label.substring(0, 11) + '...' : item.label
        doc.text(label, chartStartX - 4, barY + barHeight / 2 + 2, { align: 'right' })

        // Bar
        if (barWidthCalc > 0) {
          doc.setFillColor(item.color)
          doc.setDrawColor(pdfColors.dark)
          doc.setLineWidth(0.5)
          doc.roundedRect(chartStartX, barY, Math.max(barWidthCalc, 4), barHeight, 2, 2, 'FD')
        }

        // Value
        doc.setFontSize(7)
        doc.setTextColor(pdfColors.gray)
        doc.text(item.value.toString(), chartStartX + barWidthCalc + 4, barY + barHeight / 2 + 2)
      })
    }

    // ===== PAGE 1: Header and Summary =====

    // Header background with decorative element
    drawRoundedRect(0, 0, pageWidth, 55, 0, pdfColors.mint)

    // Decorative neo-brutalist shapes
    doc.setFillColor(pdfColors.yellow)
    doc.circle(pageWidth - 25, 25, 15, 'F')
    doc.setFillColor(pdfColors.lavender)
    doc.circle(pageWidth - 50, 15, 8, 'F')

    // Logo/Title area with shadow effect
    drawRoundedRect(margin + 2, 12 + 2, 140, 30, 4, pdfColors.dark) // shadow
    drawRoundedRect(margin, 12, 140, 30, 4, '#ffffff', pdfColors.dark)

    // Title
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    doc.text('Grooming Business Report', margin + 8, 32)

    yPos = 65

    // Date range info card
    const dateRangeText = `${format(startDate, 'MMM d, yyyy')} - ${format(today, 'MMM d, yyyy')}`
    drawRoundedRect(margin + 2, yPos + 2, pageWidth - 2 * margin, 20, 4, pdfColors.dark) // shadow
    drawRoundedRect(margin, yPos, pageWidth - 2 * margin, 20, 4, pdfColors.yellow, pdfColors.dark)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    doc.text(`Report Period: ${dateRange.label}`, margin + 10, yPos + 12)
    doc.setFont('helvetica', 'normal')
    doc.text(dateRangeText, pageWidth - margin - 10, yPos + 12, { align: 'right' })

    yPos += 35

    // Summary Statistics Grid
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    doc.text('Summary Statistics', margin, yPos)
    yPos += 10

    const cardWidth = (pageWidth - 2 * margin - 15) / 2
    const cardHeight = 35

    // Card 1: Total Revenue
    drawRoundedRect(margin + 2, yPos + 2, cardWidth, cardHeight, 4, pdfColors.dark)
    drawRoundedRect(margin, yPos, cardWidth, cardHeight, 4, pdfColors.mint, pdfColors.dark)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(`$${totalRevenue.toFixed(0)}`, margin + 10, yPos + 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(pdfColors.gray)
    doc.text('Total Revenue', margin + 10, yPos + 28)

    // Card 2: Total Appointments
    drawRoundedRect(margin + cardWidth + 17, yPos + 2, cardWidth, cardHeight, 4, pdfColors.dark)
    drawRoundedRect(margin + cardWidth + 15, yPos, cardWidth, cardHeight, 4, pdfColors.yellow, pdfColors.dark)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    doc.text(totalAppointments.toString(), margin + cardWidth + 25, yPos + 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(pdfColors.gray)
    doc.text('Total Appointments', margin + cardWidth + 25, yPos + 28)

    yPos += cardHeight + 10

    // Card 3: Completed Appointments
    drawRoundedRect(margin + 2, yPos + 2, cardWidth, cardHeight, 4, pdfColors.dark)
    drawRoundedRect(margin, yPos, cardWidth, cardHeight, 4, pdfColors.lavender, pdfColors.dark)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    doc.text(completedAppointments.toString(), margin + 10, yPos + 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(pdfColors.gray)
    doc.text('Completed', margin + 10, yPos + 28)

    // Card 4: Total Clients
    drawRoundedRect(margin + cardWidth + 17, yPos + 2, cardWidth, cardHeight, 4, pdfColors.dark)
    drawRoundedRect(margin + cardWidth + 15, yPos, cardWidth, cardHeight, 4, pdfColors.pink, pdfColors.dark)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    doc.text(clients.length.toString(), margin + cardWidth + 25, yPos + 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(pdfColors.gray)
    doc.text('Total Clients', margin + cardWidth + 25, yPos + 28)

    yPos += cardHeight + 20

    // ===== CHARTS SECTION =====

    // Appointments by Status Chart
    const statusChartData = statusData.map(item => ({
      label: item.status,
      value: item.count,
      color: item.fill,
    }))

    const chartWidth = (pageWidth - 2 * margin - 10) / 2
    const chartHeightVal = 75

    drawBarChart(statusChartData, margin, yPos, chartWidth, chartHeightVal, 'Appointments by Status')

    // Top Services Chart
    const topServicesChartData = topServicesData.map((item, index) => ({
      label: item.name,
      value: item.count,
      color: Object.values(PASTEL_COLORS)[index % Object.values(PASTEL_COLORS).length],
    }))

    drawHorizontalBarChart(topServicesChartData, margin + chartWidth + 10, yPos, chartWidth, chartHeightVal, 'Top Services')

    yPos += chartHeightVal + 15

    // ===== PAGE 2: Detailed Charts =====
    doc.addPage()
    yPos = margin

    // Page 2 Header
    drawRoundedRect(0, 0, pageWidth, 30, 0, pdfColors.blue)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    doc.text('Detailed Analytics', margin, 20)

    yPos = 45

    // Revenue Trend Chart (larger version)
    const revenueChartHeight = 80
    drawRoundedRect(margin + 2, yPos + 2, pageWidth - 2 * margin, revenueChartHeight, 4, pdfColors.dark)
    drawRoundedRect(margin, yPos, pageWidth - 2 * margin, revenueChartHeight, 4, '#ffffff', pdfColors.dark)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    doc.text('Revenue Over Time', margin + 10, yPos + 15)

    // Draw revenue line chart
    const chartAreaX = margin + 25
    const chartAreaY = yPos + 25
    const chartAreaWidth = pageWidth - 2 * margin - 35
    const chartAreaHeight = revenueChartHeight - 40

    // Sample data points for the line chart (take every nth point to avoid overcrowding)
    const sampleSize = Math.max(1, Math.floor(revenueData.length / 15))
    const sampledRevenueData = revenueData.filter((_, i) => i % sampleSize === 0 || i === revenueData.length - 1)
    const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1)

    if (sampledRevenueData.length > 1) {
      // Draw grid lines
      doc.setDrawColor(pdfColors.lightGray)
      doc.setLineWidth(0.2)
      for (let i = 0; i <= 4; i++) {
        const gridY = chartAreaY + (chartAreaHeight * i) / 4
        doc.line(chartAreaX, gridY, chartAreaX + chartAreaWidth, gridY)

        // Y-axis labels
        const value = Math.round(maxRevenue * (1 - i / 4))
        doc.setFontSize(6)
        doc.setTextColor(pdfColors.gray)
        doc.text(`$${value}`, chartAreaX - 3, gridY + 2, { align: 'right' })
      }

      // Draw line
      doc.setDrawColor(pdfColors.mintDark)
      doc.setLineWidth(1.5)

      let prevX = 0, prevY = 0
      sampledRevenueData.forEach((point, index) => {
        const x = chartAreaX + (index / (sampledRevenueData.length - 1)) * chartAreaWidth
        const y = chartAreaY + chartAreaHeight - (point.revenue / maxRevenue) * chartAreaHeight

        if (index > 0) {
          doc.line(prevX, prevY, x, y)
        }

        // Draw data point
        doc.setFillColor(pdfColors.mint)
        doc.setDrawColor(pdfColors.mintDark)
        doc.circle(x, y, 2, 'FD')

        prevX = x
        prevY = y
      })

      // X-axis labels (first, middle, last)
      doc.setFontSize(6)
      doc.setTextColor(pdfColors.gray)
      if (sampledRevenueData.length > 0) {
        doc.text(sampledRevenueData[0].date, chartAreaX, chartAreaY + chartAreaHeight + 8)
        if (sampledRevenueData.length > 2) {
          const midIndex = Math.floor(sampledRevenueData.length / 2)
          doc.text(sampledRevenueData[midIndex].date, chartAreaX + chartAreaWidth / 2, chartAreaY + chartAreaHeight + 8, { align: 'center' })
        }
        doc.text(sampledRevenueData[sampledRevenueData.length - 1].date, chartAreaX + chartAreaWidth, chartAreaY + chartAreaHeight + 8, { align: 'right' })
      }
    } else {
      doc.setFontSize(10)
      doc.setTextColor(pdfColors.gray)
      doc.text('No revenue data available', margin + (pageWidth - 2 * margin) / 2, yPos + revenueChartHeight / 2, { align: 'center' })
    }

    yPos += revenueChartHeight + 15

    // Client Acquisition Chart
    const clientChartHeight = 70
    drawRoundedRect(margin + 2, yPos + 2, pageWidth - 2 * margin, clientChartHeight, 4, pdfColors.dark)
    drawRoundedRect(margin, yPos, pageWidth - 2 * margin, clientChartHeight, 4, '#ffffff', pdfColors.dark)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    doc.text('New Clients Over Time', margin + 10, yPos + 15)

    // Draw client acquisition bar chart
    const clientChartAreaY = yPos + 22
    const clientChartAreaHeight = clientChartHeight - 35
    const sampledClientData = clientAcquisitionData.filter((_, i) => i % sampleSize === 0 || i === clientAcquisitionData.length - 1)
    const maxClients = Math.max(...clientAcquisitionData.map(d => d.clients), 1)

    if (sampledClientData.length > 0) {
      const barWidthCalc = Math.min((chartAreaWidth - (sampledClientData.length - 1) * 2) / sampledClientData.length, 15)

      sampledClientData.forEach((point, index) => {
        const x = chartAreaX + index * (barWidthCalc + 2) + (chartAreaWidth - sampledClientData.length * (barWidthCalc + 2)) / 2
        const barHeightVal = (point.clients / maxClients) * clientChartAreaHeight
        const y = clientChartAreaY + clientChartAreaHeight - barHeightVal

        if (barHeightVal > 0) {
          doc.setFillColor(pdfColors.lavender)
          doc.setDrawColor(pdfColors.dark)
          doc.setLineWidth(0.3)
          doc.roundedRect(x, y, barWidthCalc, barHeightVal, 1, 1, 'FD')
        }
      })
    }

    yPos += clientChartHeight + 15

    // ===== Data Table Section =====
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    doc.text('Recent Appointments Summary', margin, yPos)
    yPos += 8

    // Table header
    const colWidths = [35, 45, 40, 30, 25]
    const tableWidth = colWidths.reduce((a, b) => a + b, 0)
    const rowHeight = 8

    drawRoundedRect(margin, yPos, tableWidth, rowHeight, 2, pdfColors.mint, pdfColors.dark)

    const headers = ['Date', 'Client', 'Service', 'Status', 'Amount']
    let xPos = margin + 3
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pdfColors.dark)
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 5.5)
      xPos += colWidths[i]
    })

    yPos += rowHeight

    // Table rows (limit to 10 most recent)
    const recentAppointments = [...filteredAppointments]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)

    recentAppointments.forEach((apt, rowIndex) => {
      const client = clients.find((c) => c.id === apt.clientId)
      const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown'
      const date = format(parseISO(apt.startTime), 'MMM d, HH:mm')

      // Get first service name
      let serviceName = 'Multiple'
      if (apt.pets.length > 0 && apt.pets[0].services.length > 0) {
        const svc = services.find((s) => s.id === apt.pets[0].services[0].serviceId)
        serviceName = svc?.name || 'Unknown'
      }

      // Alternate row colors
      const rowColor = rowIndex % 2 === 0 ? '#ffffff' : pdfColors.lightGray
      doc.setFillColor(rowColor)
      doc.rect(margin, yPos, tableWidth, rowHeight, 'F')
      doc.setDrawColor(pdfColors.lightGray)
      doc.line(margin, yPos + rowHeight, margin + tableWidth, yPos + rowHeight)

      xPos = margin + 3
      doc.setTextColor(pdfColors.dark)

      const rowData = [
        date,
        clientName.length > 15 ? clientName.substring(0, 14) + '...' : clientName,
        serviceName.length > 12 ? serviceName.substring(0, 11) + '...' : serviceName,
        apt.status.replace('_', ' '),
        `$${apt.totalAmount.toFixed(0)}`
      ]

      rowData.forEach((cell, i) => {
        doc.text(cell, xPos, yPos + 5.5)
        xPos += colWidths[i]
      })

      yPos += rowHeight

      // Check if we need a new page
      if (yPos > pageHeight - 30) {
        doc.addPage()
        yPos = margin
      }
    })

    // Footer on last page
    yPos = pageHeight - 20
    doc.setDrawColor(pdfColors.dark)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(pdfColors.gray)
    doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}`, margin, yPos)
    doc.text('Pet Grooming Business Report', pageWidth - margin, yPos, { align: 'right' })

    // Save the PDF
    doc.save(`grooming-report-${format(today, 'yyyy-MM-dd')}.pdf`)
  }

  // Calculate summary stats
  const totalRevenue = filteredAppointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.totalAmount, 0)

  const totalAppointments = filteredAppointments.length
  const completedAppointments = filteredAppointments.filter((apt) => apt.status === 'completed').length

  return (
    <div className={cn('min-h-screen p-6', colors.pageGradient)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">Reports</h1>
            <p className="text-[#334155]">
              Analytics and insights for your grooming business
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex rounded-xl border-2 border-[#1e293b] bg-white overflow-hidden shadow-[2px_2px_0px_0px_#1e293b]">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.days}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    dateRange.days === range.days
                      ? 'bg-[#d1fae5] text-[#1e293b]'
                      : 'text-[#334155] hover:bg-[#fef9c3]'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
            {/* Export Buttons */}
            <Button onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handleExportCSV} variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ animation: 'fadeInUp 0.5s ease-out forwards' }}
        >
          <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#d1fae5] p-3 border-2 border-[#1e293b]">
                <TrendingUp className="h-6 w-6 text-[#1e293b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">${totalRevenue.toFixed(0)}</p>
                <p className="text-sm text-[#334155]">Total Revenue</p>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#fef9c3] p-3 border-2 border-[#1e293b]">
                <Calendar className="h-6 w-6 text-[#1e293b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">{totalAppointments}</p>
                <p className="text-sm text-[#334155]">Total Appointments</p>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#e9d5ff] p-3 border-2 border-[#1e293b]">
                <Scissors className="h-6 w-6 text-[#1e293b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">{completedAppointments}</p>
                <p className="text-sm text-[#334155]">Completed</p>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#fce7f3] p-3 border-2 border-[#1e293b]">
                <Users className="h-6 w-6 text-[#1e293b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">{clients.length}</p>
                <p className="text-sm text-[#334155]">Total Clients</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Over Time */}
          <Card
            className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.1s forwards', opacity: 0 }}
          >
            <CardTitle className="mb-4 text-[#1e293b]">Revenue Over Time</CardTitle>
            <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #1e293b',
                      borderRadius: '12px',
                      boxShadow: '2px 2px 0px 0px #1e293b',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ fill: PASTEL_COLORS.mint, stroke: '#059669', strokeWidth: 2, r: 4 }}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Appointments by Status */}
          <Card
            className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.2s forwards', opacity: 0 }}
          >
            <CardTitle className="mb-4 text-[#1e293b]">Appointments by Status</CardTitle>
            <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #1e293b',
                      borderRadius: '12px',
                      boxShadow: '2px 2px 0px 0px #1e293b',
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} style={{ cursor: 'default' }}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#1e293b" strokeWidth={2} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Services */}
          <Card
            className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s forwards', opacity: 0 }}
          >
            <CardTitle className="mb-4 text-[#1e293b]">Top Services</CardTitle>
            <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServicesData} layout="vertical" style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #1e293b',
                      borderRadius: '12px',
                      boxShadow: '2px 2px 0px 0px #1e293b',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} style={{ cursor: 'default' }}>
                    {topServicesData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={Object.values(PASTEL_COLORS)[index % Object.values(PASTEL_COLORS).length]}
                        stroke="#1e293b"
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Client Acquisition */}
          <Card
            className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.4s forwards', opacity: 0 }}
          >
            <CardTitle className="mb-4 text-[#1e293b]">New Clients Over Time</CardTitle>
            <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clientAcquisitionData} style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #1e293b',
                      borderRadius: '12px',
                      boxShadow: '2px 2px 0px 0px #1e293b',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clients"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: PASTEL_COLORS.lavender, stroke: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Disable chart selection/focus highlighting */
        .recharts-wrapper,
        .recharts-wrapper svg,
        .recharts-surface,
        .recharts-layer,
        .recharts-bar-rectangle,
        .recharts-line-curve,
        .recharts-dot {
          outline: none !important;
          cursor: default !important;
        }

        .recharts-wrapper:focus,
        .recharts-wrapper svg:focus,
        .recharts-surface:focus,
        .recharts-layer:focus {
          outline: none !important;
        }

        .recharts-wrapper *:focus {
          outline: none !important;
        }
      `}</style>
    </div>
  )
}
