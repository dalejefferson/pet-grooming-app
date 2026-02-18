import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Calendar, MapPin, Phone, User, Users, PawPrint } from 'lucide-react'
import { Card, Button } from '../../components/common'
import { useBookingContext } from '../../context/BookingContext'
import { formatCurrency } from '@/lib/utils'

export function BookingSuccessPage() {
  const { organization, bookingState, resetBookingState } = useBookingContext()

  // Capture summary data in a ref so it survives the reset
  const summaryRef = useRef(bookingState.bookingSummary)

  // Clear booking state on mount since the booking is complete
  useEffect(() => {
    resetBookingState()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const summary = summaryRef.current
  const isRequested = summary?.isRequested ?? false

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-100">
          <CheckCircle className="h-12 w-12 text-success-600" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRequested ? 'Booking Request Submitted!' : 'Booking Confirmed!'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isRequested
            ? "We've received your booking request. We'll contact you within 24 hours to confirm."
            : 'Your appointment has been confirmed. We look forward to seeing you!'}
        </p>
      </div>

      {summary && (
        <Card className="text-left">
          <h2 className="text-lg font-semibold text-gray-900">Appointment Details</h2>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{summary.date}</p>
                <p className="text-gray-600">
                  {summary.time} - {summary.endTime}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{organization.name}</p>
                <p className="text-gray-600">{organization.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-gray-600">{organization.phone}</p>
              </div>
            </div>

            {/* Groomer */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center">
                {summary.groomerName ? (
                  <User className="h-5 w-5 text-gray-400" />
                ) : (
                  <Users className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Your Groomer</p>
                <p className="font-medium text-gray-900">
                  {summary.groomerName || 'First Available Groomer'}
                </p>
              </div>
            </div>

            {/* Pets */}
            {summary.petNames && (
              <div className="flex items-start gap-3">
                <PawPrint className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Pets</p>
                  <p className="font-medium text-gray-900">{summary.petNames}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between text-lg">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-semibold text-gray-900">{summary.totalAmount}</span>
            </div>
            {summary.depositAmount != null && summary.depositAmount > 0 && (
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-gray-600">Deposit</span>
                <span className={summary.depositPaid ? 'text-success-600' : 'text-warning-600'}>
                  {formatCurrency(summary.depositAmount)}{' '}
                  {summary.depositPaid ? '(Paid)' : '(Pending)'}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="bg-primary-50 border-primary-200 text-left">
        <h3 className="font-medium text-primary-900">What's Next?</h3>
        <ul className="mt-3 space-y-2 text-sm text-primary-800">
          {isRequested ? (
            <>
              <li>We'll review your request and contact you within 24 hours</li>
              <li>Once confirmed, you'll receive a confirmation email</li>
              <li>A deposit may be required to finalize your booking</li>
            </>
          ) : (
            <>
              <li>You'll receive a confirmation email shortly</li>
              <li>We'll send reminders before your appointment</li>
              <li>Please arrive 5 minutes early</li>
              <li>Bring vaccination records if this is your pet's first visit</li>
            </>
          )}
        </ul>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to={`/book/${organization.slug}/start`}>
          <Button variant="outline">Book Another Appointment</Button>
        </Link>
        <a href={`tel:${organization.phone}`}>
          <Button variant="secondary">
            <Phone className="mr-2 h-4 w-4" />
            Call Us
          </Button>
        </a>
      </div>
    </div>
  )
}
