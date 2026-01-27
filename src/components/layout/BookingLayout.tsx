import { Outlet, useParams } from 'react-router-dom'
import { Dog } from 'lucide-react'
import { useOrganizationBySlug } from '@/hooks'
import { LoadingPage } from '@/components/common'

export function BookingLayout() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const { data: org, isLoading, error } = useOrganizationBySlug(orgSlug || '')

  if (isLoading) {
    return <LoadingPage />
  }

  if (error || !org) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
        <div className="text-center rounded-2xl border-2 border-[#1e293b] bg-white p-8 shadow-[3px_3px_0px_0px_#1e293b]">
          <Dog className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="mt-4 text-2xl font-bold text-[#1e293b]">
            Business Not Found
          </h1>
          <p className="mt-2 text-gray-600">
            We couldn't find the grooming business you're looking for.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="border-b-2 border-[#1e293b] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border-2 border-[#1e293b] bg-primary-100 p-2 shadow-[2px_2px_0px_0px_#1e293b]">
              <Dog className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1e293b]">{org.name}</h1>
              <p className="text-sm text-[#64748b]">Book your grooming appointment</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet context={{ organization: org }} />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#1e293b] bg-white py-6">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-[#64748b]">
          <p className="font-semibold text-[#334155]">{org.address}</p>
          <p className="mt-1">{org.phone} | {org.email}</p>
        </div>
      </footer>
    </div>
  )
}
