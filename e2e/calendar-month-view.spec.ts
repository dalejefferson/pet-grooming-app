import { test, expect } from '@playwright/test'

test.describe('Calendar Month View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/calendar')
    // Month is the default view, wait for calendar to render
    await page.waitForSelector('.fc-view-harness', { timeout: 15000 })
  })

  test('event cards in last row are not clipped by overflow', async ({ page }) => {
    // Get the view harness container
    const viewHarness = page.locator('.fc-view-harness')
    await expect(viewHarness).toBeVisible()

    // Get all daygrid rows
    const daygridRows = page.locator('.fc-daygrid-body tr')
    const rowCount = await daygridRows.count()
    expect(rowCount).toBeGreaterThan(0)

    // Get the last row
    const lastRow = daygridRows.nth(rowCount - 1)
    await expect(lastRow).toBeVisible()

    // Check that no ancestor has overflow: hidden that would clip the events
    // We verify this by checking the computed styles
    const ancestorOverflowCheck = await page.evaluate(() => {
      const viewHarness = document.querySelector('.fc-view-harness')
      if (!viewHarness) return { hasProblematicOverflow: false, element: null }

      let current: Element | null = viewHarness
      while (current && current !== document.body) {
        const style = window.getComputedStyle(current)
        const overflow = style.overflow
        const overflowY = style.overflowY

        // overflow-hidden on a flex container with scrollable children is problematic
        if (
          (overflow === 'hidden' || overflowY === 'hidden') &&
          current.classList.contains('fc-view-harness') === false
        ) {
          // Check if this is the Card wrapper which shouldn't have overflow-hidden
          if (current.classList.contains('overflow-hidden')) {
            return {
              hasProblematicOverflow: true,
              element: current.className,
            }
          }
        }
        current = current.parentElement
      }
      return { hasProblematicOverflow: false, element: null }
    })

    expect(ancestorOverflowCheck.hasProblematicOverflow).toBe(false)
  })

  test('calendar grid fills available viewport height', async ({ page }) => {
    // Set a specific viewport size
    await page.setViewportSize({ width: 1280, height: 800 })

    // Wait for layout to stabilize
    await page.waitForTimeout(500)

    // Get the calendar container bounding box
    const calendarCard = page.locator('.fc').first()
    await expect(calendarCard).toBeVisible()

    const boundingBox = await calendarCard.boundingBox()
    expect(boundingBox).not.toBeNull()

    if (boundingBox) {
      // Calendar should be at least 400px tall (min-height in the CSS)
      // and should use significant portion of available space
      expect(boundingBox.height).toBeGreaterThan(400)

      // Verify calendar isn't squished - should use at least 50% of viewport
      const viewportUsage = boundingBox.height / 800
      expect(viewportUsage).toBeGreaterThan(0.5)
    }
  })

  test('events are visible and not cut off', async ({ page }) => {
    // Look for any event cards on the calendar
    const events = page.locator('.fc-event')
    const eventCount = await events.count()

    if (eventCount > 0) {
      // Check first visible event is fully in viewport
      const firstEvent = events.first()
      await expect(firstEvent).toBeVisible()

      // Get the event's bounding box
      const eventBox = await firstEvent.boundingBox()
      expect(eventBox).not.toBeNull()

      if (eventBox) {
        // Verify event has reasonable dimensions (not squished)
        expect(eventBox.height).toBeGreaterThan(10)
        expect(eventBox.width).toBeGreaterThan(20)
      }
    }
  })

  test('month view container has proper corner clipping', async ({ page }) => {
    const viewHarness = page.locator('.fc-view-harness')
    await expect(viewHarness).toBeVisible()

    // Check the computed styles for proper corner handling
    const containerStyle = await viewHarness.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        overflow: style.overflow,
        borderRadius: style.borderRadius,
      }
    })

    // View harness container SHOULD have overflow-hidden for border-radius clipping
    // This ensures the header row corners don't stick outside the rounded border
    expect(containerStyle.overflow).toBe('hidden')
    // Should have rounded corners
    expect(containerStyle.borderRadius).not.toBe('0px')
  })
})
