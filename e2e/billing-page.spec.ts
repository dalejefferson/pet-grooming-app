import { test, expect } from '@playwright/test'

test.describe('Billing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Log in with admin credentials
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@pawsclaws.com')
    await page.getByLabel('Password').fill('demo123')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()

    // Wait for login to complete and app to load
    await page.waitForURL('/app/**', { timeout: 15000 })

    // Dismiss product tour if it appears (there are two skip buttons with different casing)
    const tourDialog = page.getByRole('dialog', { name: 'Product tour' })
    if (await tourDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click the "Skip Tour" button at the top of the tour overlay
      await tourDialog.getByRole('button', { name: /skip tour/i }).first().click()
      // Wait for tour to disappear
      await expect(tourDialog).not.toBeVisible({ timeout: 3000 })
    }

    // Navigate to billing page via sidebar link
    await page.getByRole('link', { name: 'Billing' }).click()
    await page.waitForURL('/app/billing', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
  })

  test('dev bypass banner is visible and does not block billing sections', async ({ page }) => {
    // Verify the dev bypass banner is shown (lemon card with "Dev Bypass Active")
    const devBypassHeading = page.getByRole('heading', { name: 'Dev Bypass Active' })
    await expect(devBypassHeading).toBeVisible({ timeout: 10000 })

    // Verify all 4 billing sections render simultaneously below the banner

    // 1. PlanStatusCard — "Current Plan"
    const currentPlan = page.getByRole('heading', { name: 'Current Plan' })
    await expect(currentPlan).toBeVisible()

    // 2. PlanComparison — "Compare Plans"
    const comparePlans = page.getByRole('heading', { name: 'Compare Plans' })
    await expect(comparePlans).toBeVisible()

    // 3. InvoiceHistory — "Invoice History"
    const invoiceHistory = page.getByRole('heading', { name: 'Invoice History' })
    await expect(invoiceHistory).toBeVisible()

    // 4. PaymentMethodCard — "Payment Method"
    const paymentMethod = page.getByRole('heading', { name: 'Payment Method' })
    await expect(paymentMethod).toBeVisible()
  })

  test('all billing sections are in the DOM at the same time', async ({ page }) => {
    // Wait for the page to fully render
    await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible({ timeout: 10000 })

    // Count all expected section headings to confirm none are conditionally hidden
    const sectionHeadings = [
      'Dev Bypass Active',
      'Current Plan',
      'Compare Plans',
      'Invoice History',
      'Payment Method',
    ]

    for (const heading of sectionHeadings) {
      const el = page.getByRole('heading', { name: heading })
      await expect(el).toBeAttached()
      await expect(el).toBeVisible()
    }
  })

  test('dev bypass banner shows correct informational text', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dev Bypass Active' })).toBeVisible({ timeout: 10000 })

    // Verify the informational text about bypassed subscription gates
    await expect(
      page.getByText('Subscription gates are bypassed')
    ).toBeVisible()
  })
})
