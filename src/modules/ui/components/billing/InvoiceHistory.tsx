import { useState, useCallback, useEffect } from 'react'
import { Card, CardTitle, Badge, Button, LoadingSpinner } from '../common'
import { useInvoices } from '@/modules/database/hooks'
import type { StripeInvoice } from '@/modules/database/types'
import { FileText, Download, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

function getInvoiceBadge(status: StripeInvoice['status']): {
  variant: 'success' | 'warning' | 'danger' | 'default' | 'outline'
  label: string
} {
  switch (status) {
    case 'paid':
      return { variant: 'success', label: 'Paid' }
    case 'open':
      return { variant: 'warning', label: 'Open' }
    case 'void':
      return { variant: 'default', label: 'Void' }
    case 'draft':
      return { variant: 'outline', label: 'Draft' }
    case 'uncollectible':
      return { variant: 'danger', label: 'Uncollectible' }
    default:
      return { variant: 'default', label: status }
  }
}

export function InvoiceHistory() {
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [accumulated, setAccumulated] = useState<StripeInvoice[]>([])
  const [canLoadMore, setCanLoadMore] = useState(true)

  const { data, isLoading, isError, refetch } = useInvoices(cursor)

  // When data arrives, accumulate invoices
  useEffect(() => {
    if (!data) return
    if (cursor === undefined) {
      setAccumulated(data.invoices)
    } else {
      setAccumulated((prev) => {
        const existingIds = new Set(prev.map((inv) => inv.id))
        const newInvoices = data.invoices.filter((inv) => !existingIds.has(inv.id))
        return [...prev, ...newInvoices]
      })
    }
    setCanLoadMore(data.hasMore)
  }, [data, cursor])

  const handleLoadMore = useCallback(() => {
    if (!accumulated.length) return
    const lastId = accumulated[accumulated.length - 1].id
    setCursor(lastId)
  }, [accumulated])

  // Loading — first page only
  if (isLoading && accumulated.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#1e293b]" />
          <CardTitle>Invoice History</CardTitle>
        </div>
        <div className="mt-4 flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    )
  }

  // Error — first page only
  if (isError && accumulated.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#1e293b]" />
          <CardTitle>Invoice History</CardTitle>
        </div>
        <div className="mt-4 text-center py-8">
          <p className="text-sm text-[#64748b]">Failed to load invoices.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  // Empty
  if (accumulated.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#1e293b]" />
          <CardTitle>Invoice History</CardTitle>
        </div>
        <p className="mt-3 text-sm text-[#64748b]">
          No invoices yet. Your billing history will appear here after your first payment.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-[#1e293b]" />
        <CardTitle>Invoice History</CardTitle>
      </div>

      {/* Desktop table */}
      <div className="mt-4 hidden sm:block">
        <div className="overflow-hidden rounded-xl border-2 border-[#1e293b]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1e293b] bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-[#1e293b]">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-[#1e293b]">Invoice</th>
                <th className="px-4 py-3 text-right font-semibold text-[#1e293b]">Amount</th>
                <th className="px-4 py-3 text-center font-semibold text-[#1e293b]">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-[#1e293b]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accumulated.map((invoice, i) => {
                const badge = getInvoiceBadge(invoice.status)
                return (
                  <tr
                    key={invoice.id}
                    className={i < accumulated.length - 1 ? 'border-b border-gray-100' : ''}
                  >
                    <td className="px-4 py-3 text-[#334155]">
                      {format(new Date(invoice.created * 1000), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{invoice.number || '\u2014'}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#1e293b]">
                      ${(invoice.amountPaid / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <InvoiceActions invoice={invoice} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 sm:hidden">
        {accumulated.map((invoice) => {
          const badge = getInvoiceBadge(invoice.status)
          return (
            <div
              key={invoice.id}
              className="rounded-xl border-2 border-[#1e293b] bg-white p-3 shadow-[2px_2px_0px_0px_#1e293b]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1e293b]">
                  {format(new Date(invoice.created * 1000), 'MMM d, yyyy')}
                </span>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-[#64748b]">{invoice.number || '\u2014'}</span>
                <span className="font-semibold text-[#1e293b]">
                  ${(invoice.amountPaid / 100).toFixed(2)}
                </span>
              </div>
              {(invoice.invoicePdf || invoice.hostedInvoiceUrl) && (
                <div className="mt-2">
                  <InvoiceActions invoice={invoice} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Load more */}
      {canLoadMore && (
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm" loading={isLoading} onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}
    </Card>
  )
}

function InvoiceActions({ invoice }: { invoice: StripeInvoice }) {
  if (!invoice.invoicePdf && !invoice.hostedInvoiceUrl) return null

  return (
    <div className="flex items-center justify-end gap-2">
      {invoice.invoicePdf && (
        <a
          href={invoice.invoicePdf}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> PDF
        </a>
      )}
      {invoice.hostedInvoiceUrl && (
        <a
          href={invoice.hostedInvoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View
        </a>
      )}
    </div>
  )
}
