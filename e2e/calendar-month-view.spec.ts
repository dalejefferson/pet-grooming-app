import { test, expect } from '@playwright/test'

test.describe('Calendar Month View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/calendar')
    // Month is the default view, wait for calendar to render
    await page.waitForSelector('.rbc-month-view', { timeout: 15000 })
  })

  test('event cards in last row are not clipped by overflow', async ({ page }) => {
    // Get the month view container
    const monthView = page.locator('.rbc-month-view')
    await expect(monthView).toBeVisible()

    // Get all month rows
    const monthRows = page.locator('.rbc-month-row')
    const rowCount = await monthRows.count()
    expect(rowCount).toBeGreaterThan(0)

    // Get the last row
    const lastRow = monthRows.nth(rowCount - 1)
    await expect(lastRow).toBeVisible()

    // Check that no ancestor has overflow: hidden that would clip the events
    // We verify this by checking the computed styles
    const ancestorOverflowCheck = await page.evaluate(() => {
      const monthView = document.querySelector('.rbc-month-view')
      if (!monthView) return { hasProblematicOverflow: false, element: null }

      let current: Element | null = monthView
      while (current && current !== document.body) {
        const style = window.getComputedStyle(current)
        const overflow = style.overflow
        const overflowY = style.overflowY

        // overflow-hidden on a flex container with scrollable children is problematic
        if (
          (overflow === 'hidden' || overflowY === 'hidden') &&
          current.classList.contains('rbc-month-view') === false
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
    const calendarCard = page.locator('.rbc-calendar').first()
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
    const events = page.locator('.rbc-event')
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
    const monthView = page.locator('.rbc-month-view')
    await expect(monthView).toBeVisible()

    // Check the computed styles for proper corner handling
    const containerStyle = await monthView.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        overflow: style.overflow,
        borderRadius: style.borderRadius,
      }
    })

    // Month view container SHOULD have overflow-hidden for border-radius clipping
    // This ensures the header row corners don't stick outside the rounded border
    expect(containerStyle.overflow).toBe('hidden')
    // Should have rounded corners
    expect(containerStyle.borderRadius).not.toBe('0px')
  })
})
