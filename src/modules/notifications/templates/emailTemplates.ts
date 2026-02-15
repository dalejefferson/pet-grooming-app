/**
 * Email templates for Sit Pretty Club notifications.
 *
 * All templates share a common neo-brutalist wrapper with inline CSS
 * (email clients don't support external stylesheets).
 */

// ---------------------------------------------------------------------------
// Shared wrapper
// ---------------------------------------------------------------------------

function wrapInLayout(businessName: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email from ${escapeHtml(businessName)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAF8; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
  <div style="background-color: #FAFAF8; padding: 32px 16px;">
    <div style="max-width: 560px; margin: 0 auto; background: white; border: 2px solid #1e293b; border-radius: 16px; box-shadow: 3px 3px 0px 0px #1e293b; padding: 32px;">
      ${content}
      <div style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        Sent from ${escapeHtml(businessName)} via Sit Pretty Club
        <br style="margin-top: 8px;" />
        <span style="font-size: 11px;">If you no longer wish to receive these emails, please contact ${escapeHtml(businessName)}.</span>
      </div>
    </div>
  </div>
</body>
</html>`
}

function heading(text: string): string {
  return `<h1 style="color: #1e293b; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">${escapeHtml(text)}</h1>`
}

function paragraph(text: string): string {
  return `<p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">${text}</p>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// Test email
// ---------------------------------------------------------------------------

export function buildTestEmail(params: {
  businessName: string
}): { subject: string; html: string } {
  const { businessName } = params

  const content = [
    heading('Test Email'),
    paragraph(
      `This is a test email from your ${escapeHtml(businessName)} account. ` +
      'If you received this, your email settings are working correctly!'
    ),
  ].join('\n')

  return {
    subject: `Test Email from ${businessName}`,
    html: wrapInLayout(businessName, content),
  }
}

// ---------------------------------------------------------------------------
// Ready for pickup
// ---------------------------------------------------------------------------

export function buildReadyForPickupEmail(params: {
  clientName: string
  petNames: string
  businessName: string
}): { subject: string; html: string } {
  const { clientName, petNames, businessName } = params

  const content = [
    heading(`${escapeHtml(petNames)} is ready for pickup!`),
    paragraph(
      `Hi ${escapeHtml(clientName)}, ${escapeHtml(petNames)} is all done and looking fabulous! ` +
      `Ready for pickup at ${escapeHtml(businessName)}.`
    ),
  ].join('\n')

  return {
    subject: `${petNames} is ready for pickup!`,
    html: wrapInLayout(businessName, content),
  }
}

// ---------------------------------------------------------------------------
// Appointment reminder
// ---------------------------------------------------------------------------

export function buildAppointmentReminderEmail(params: {
  clientName: string
  petName: string
  date: string
  time: string
  businessName: string
}): { subject: string; html: string } {
  const { clientName, petName, date, time, businessName } = params

  const content = [
    heading(`Reminder: ${escapeHtml(petName)}'s grooming appointment`),
    paragraph(
      `Hi ${escapeHtml(clientName)}, this is a reminder that ${escapeHtml(petName)}'s ` +
      `grooming appointment is on ${escapeHtml(date)} at ${escapeHtml(time)}. ` +
      'Please arrive 5 minutes early. See you soon!'
    ),
  ].join('\n')

  return {
    subject: `Reminder: ${petName}'s grooming appointment`,
    html: wrapInLayout(businessName, content),
  }
}

// ---------------------------------------------------------------------------
// Vaccination reminder
// ---------------------------------------------------------------------------

interface VaccinationReminderParams {
  clientName: string
  petName: string
  vaccinationName: string
  expirationDate: string
  urgency: '30_day' | '7_day' | 'expired'
  businessName: string
}

const URGENCY_CONFIG: Record<
  VaccinationReminderParams['urgency'],
  {
    subjectPrefix: string
    bannerBg: string
    bannerText: string
    bodyFragment: (vacName: string, expDate: string) => string
  }
> = {
  '30_day': {
    subjectPrefix: '',
    bannerBg: '#fef9c3',
    bannerText: '#854d0e',
    bodyFragment: (_vacName, expDate) =>
      `expires on ${escapeHtml(expDate)}`,
  },
  '7_day': {
    subjectPrefix: 'Urgent: ',
    bannerBg: '#fed7aa',
    bannerText: '#9a3412',
    bodyFragment: (_vacName, expDate) =>
      `expires in less than a week on ${escapeHtml(expDate)}`,
  },
  expired: {
    subjectPrefix: 'Action Required: ',
    bannerBg: '#fecaca',
    bannerText: '#991b1b',
    bodyFragment: (_vacName, expDate) =>
      `has expired (was due ${escapeHtml(expDate)})`,
  },
}

// ---------------------------------------------------------------------------
// Booking confirmation
// ---------------------------------------------------------------------------

export function buildBookingConfirmationEmail(params: {
  clientName: string
  petNames: string
  date: string
  time: string
  groomerName?: string
  totalAmount: string
  businessName: string
  isRequested: boolean
}): { subject: string; html: string } {
  const { clientName, petNames, date, time, groomerName, totalAmount, businessName, isRequested } = params

  const statusBanner = isRequested
    ? `<div style="background-color: #fef9c3; color: #854d0e; border: 2px solid #854d0e; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; font-weight: 600;">
  Booking request received &mdash; we'll confirm within 24 hours
</div>`
    : `<div style="background-color: #d1fae5; color: #166534; border: 2px solid #166534; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; font-weight: 600;">
  Your appointment is confirmed!
</div>`

  const groomerLine = groomerName
    ? `<tr><td style="color: #64748b; padding: 4px 16px 4px 0; font-size: 14px;">Groomer</td><td style="color: #1e293b; font-weight: 600; font-size: 14px;">${escapeHtml(groomerName)}</td></tr>`
    : ''

  const detailsTable = `<table style="width: 100%; margin: 16px 0;">
  <tr><td style="color: #64748b; padding: 4px 16px 4px 0; font-size: 14px;">Date</td><td style="color: #1e293b; font-weight: 600; font-size: 14px;">${escapeHtml(date)}</td></tr>
  <tr><td style="color: #64748b; padding: 4px 16px 4px 0; font-size: 14px;">Time</td><td style="color: #1e293b; font-weight: 600; font-size: 14px;">${escapeHtml(time)}</td></tr>
  <tr><td style="color: #64748b; padding: 4px 16px 4px 0; font-size: 14px;">Pet(s)</td><td style="color: #1e293b; font-weight: 600; font-size: 14px;">${escapeHtml(petNames)}</td></tr>
  ${groomerLine}
  <tr><td style="color: #64748b; padding: 4px 16px 4px 0; font-size: 14px;">Total</td><td style="color: #1e293b; font-weight: 600; font-size: 14px;">${escapeHtml(totalAmount)}</td></tr>
</table>`

  const content = [
    heading(isRequested ? 'Booking Request Received' : 'Booking Confirmed'),
    statusBanner,
    paragraph(`Hi ${escapeHtml(clientName)}, thank you for booking with ${escapeHtml(businessName)}!`),
    detailsTable,
    paragraph(
      isRequested
        ? "We'll review your request and get back to you within 24 hours. Please arrive 5 minutes early once your appointment is confirmed."
        : 'Please arrive 5 minutes early. We look forward to seeing you!'
    ),
  ].join('\n')

  return {
    subject: isRequested
      ? `Booking request received - ${businessName}`
      : `Booking confirmed - ${businessName}`,
    html: wrapInLayout(businessName, content),
  }
}

// ---------------------------------------------------------------------------
// New booking alert (for staff)
// ---------------------------------------------------------------------------

export function buildNewBookingAlertEmail(params: {
  groomerName: string
  clientName: string
  petNames: string
  date: string
  time: string
  isNewClient: boolean
  businessName: string
}): { subject: string; html: string } {
  const { groomerName, clientName, petNames, date, time, isNewClient, businessName } = params

  const newClientBadge = isNewClient
    ? ' <span style="background-color: #fef9c3; color: #854d0e; border: 1px solid #854d0e; border-radius: 8px; padding: 2px 8px; font-size: 12px; font-weight: 600;">New Client</span>'
    : ''

  const content = [
    heading('New Booking Alert'),
    paragraph(`Hi ${escapeHtml(groomerName)}, a new appointment has been booked!`),
    `<table style="width: 100%; margin: 16px 0;">
  <tr><td style="color: #64748b; padding: 4px 16px 4px 0; font-size: 14px;">Client</td><td style="color: #1e293b; font-weight: 600; font-size: 14px;">${escapeHtml(clientName)}${newClientBadge}</td></tr>
  <tr><td style="color: #64748b; padding: 4px 16px 4px 0; font-size: 14px;">Pet(s)</td><td style="color: #1e293b; font-weight: 600; font-size: 14px;">${escapeHtml(petNames)}</td></tr>
  <tr><td style="color: #64748b; padding: 4px 16px 4px 0; font-size: 14px;">Date</td><td style="color: #1e293b; font-weight: 600; font-size: 14px;">${escapeHtml(date)}</td></tr>
  <tr><td style="color: #64748b; padding: 4px 16px 4px 0; font-size: 14px;">Time</td><td style="color: #1e293b; font-weight: 600; font-size: 14px;">${escapeHtml(time)}</td></tr>
</table>`,
    paragraph('Log in to your dashboard to view the full appointment details.'),
  ].join('\n')

  return {
    subject: `New booking: ${clientName} - ${petNames} on ${date}`,
    html: wrapInLayout(businessName, content),
  }
}

// ---------------------------------------------------------------------------
// Vaccination reminder
// ---------------------------------------------------------------------------

export function buildVaccinationReminderEmail(
  params: VaccinationReminderParams
): { subject: string; html: string } {
  const { clientName, petName, vaccinationName, expirationDate, urgency, businessName } = params
  const config = URGENCY_CONFIG[urgency]

  // Build subject
  let subject: string
  switch (urgency) {
    case '30_day':
      subject = `${petName}'s ${vaccinationName} vaccination expires soon`
      break
    case '7_day':
      subject = `Urgent: ${petName}'s ${vaccinationName} vaccination expires this week`
      break
    case 'expired':
      subject = `Action Required: ${petName}'s ${vaccinationName} vaccination has expired`
      break
  }

  const banner = `<div style="background-color: ${config.bannerBg}; color: ${config.bannerText}; border: 2px solid ${config.bannerText}; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px; font-weight: 600;">
  ${escapeHtml(petName)}'s ${escapeHtml(vaccinationName)} vaccination ${config.bodyFragment(vaccinationName, expirationDate)}
</div>`

  const content = [
    heading('Vaccination Reminder'),
    banner,
    paragraph(
      `Hi ${escapeHtml(clientName)}, this is a reminder about ${escapeHtml(petName)}'s ` +
      `${escapeHtml(vaccinationName)} vaccination. Please contact your veterinarian to ` +
      'get this updated as soon as possible.'
    ),
  ].join('\n')

  return {
    subject,
    html: wrapInLayout(businessName, content),
  }
}
