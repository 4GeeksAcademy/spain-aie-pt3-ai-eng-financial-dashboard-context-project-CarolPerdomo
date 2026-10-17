import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { createServer } from 'vite'

const movements = [
  { create_date: '2024-01-05', amount: 10000, operation_type: 'income', category: 'sales', business_type: 'B2B' },
  { create_date: '2024-01-06', amount: 4000, operation_type: 'outcome', category: 'operational', business_type: 'B2B' },
  { create_date: '2024-02-05', amount: 12000, operation_type: 'income', category: 'sales', business_type: 'B2B' },
  { create_date: '2024-02-06', amount: 3000, operation_type: 'outcome', category: 'operational', business_type: 'B2B' },
]

async function checkAxe(page, state) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  assert.deepEqual(violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })), [], state)
}

async function contrastRatio(locator, property) {
  return locator.evaluate((element, colorProperty) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext('2d', { willReadFrequently: true })
    const background = getComputedStyle(element.closest('[data-slot="card"]')).backgroundColor
    const luminance = (pixels) => Array.from(pixels).slice(0, 3).map((channel) => {
      const value = channel / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    }).reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0)
    context.fillStyle = background
    context.fillRect(0, 0, 1, 1)
    const backgroundLuminance = luminance(context.getImageData(0, 0, 1, 1).data)
    context.fillStyle = getComputedStyle(element)[colorProperty]
    context.fillRect(0, 0, 1, 1)
    const foregroundLuminance = luminance(context.getImageData(0, 0, 1, 1).data)
    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  }, property)
}

const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0 },
})
let browser

try {
  await server.listen()
  const address = server.httpServer.address()
  const url = `http://127.0.0.1:${address.port}`
  browser = await chromium.launch()

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
    try {
      const page = await context.newPage()
      let releaseResponse
      const responseReady = new Promise((resolve) => { releaseResponse = resolve })
      await page.route('**/api/metrics', async (route) => {
        await responseReady
        await route.fulfill({ json: movements })
      })
      await page.goto(url)
      await page.getByRole('status').filter({ hasText: 'Loading financial data.' }).waitFor()
      assert.equal(await page.locator('[aria-busy="true"]').count(), 2)
      await checkAxe(page, 'loading')
      releaseResponse()
      await page.getByRole('status').filter({ hasText: 'Financial data loaded.' }).waitFor()
      assert.equal(await page.locator('[aria-busy="true"]').count(), 0)
      assert.equal(await page.getByRole('table', { name: 'Monthly income and outcome', exact: true }).count(), 1)
      assert.equal(await page.getByRole('table', { name: 'Monthly profit margin', exact: true }).count(), 1)
      assert.equal(await page.getByRole('cell', { name: '$10,000', exact: true }).count(), 1)
      assert.equal(await page.getByRole('cell', { name: '60.0%', exact: true }).count(), 1)
      assert.equal(await page.locator('img:not([alt])').count(), 0)
      assert.equal(await page.locator('svg.lucide:not([aria-hidden="true"])').count(), 0)

      const focusContrasts = []
      for (const [index, name] of ['Income vs. Outcome', 'Profit Margin %'].entries()) {
        const chart = page.getByRole('application', { name, exact: true })
        await page.keyboard.press('Tab')
        assert.equal(await chart.evaluate((element) => document.activeElement === element), true, `${name}: Tab`)
        assert.equal(await chart.evaluate((element) => element.matches(':focus-visible')), true)
        assert.equal(await chart.evaluate((element) => getComputedStyle(element).outlineStyle !== 'none'), true)
        const focusContrast = await contrastRatio(chart, 'outlineColor')
        focusContrasts.push(focusContrast.toFixed(2))
        assert.ok(focusContrast >= 3, `${name}: focus contrast ${focusContrast.toFixed(2)} < 3:1`)
        const tooltip = page.locator('.recharts-tooltip-wrapper').nth(index)
        await tooltip.getByText('Jan 2024', { exact: true }).waitFor()
        await page.keyboard.press('ArrowRight')
        await tooltip.getByText('Feb 2024', { exact: true }).waitFor()
        await page.keyboard.press('ArrowLeft')
        await tooltip.getByText('Jan 2024', { exact: true }).waitFor()
      }
      await page.keyboard.press('Tab')
      assert.equal(await page.evaluate(() => document.activeElement.tagName), 'BODY', 'No keyboard trap')
      await page.keyboard.press('Shift+Tab')
      assert.equal(await page.getByRole('application', { name: 'Profit Margin %', exact: true }).evaluate((element) => document.activeElement === element), true)

      const mutedContrast = await contrastRatio(page.locator('[data-slot="card-description"]').first(), 'color')
      assert.ok(mutedContrast >= 4.5, `Muted text contrast ${mutedContrast.toFixed(2)} < 4.5:1`)
      await checkAxe(page, 'loaded, including keyboard tooltips')
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow')
      await page.screenshot({ path: `/tmp/dashboard-a11y-${viewport.width}.png`, fullPage: true })
      if (viewport.width === 1440) {
        await page.setViewportSize({ width: 720, height: 500 })
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Reflow at 720px, equivalent to a 1440px viewport at 200% browser zoom')
        await page.setViewportSize(viewport)
      }

      await page.unroute('**/api/metrics')
      await page.route('**/api/metrics', (route) => route.fulfill({ json: [] }))
      await page.reload()
      await page.getByRole('status').filter({ hasText: 'Financial data loaded.' }).waitFor()
      assert.equal(await page.getByRole('application').count(), 0)
      assert.equal(await page.getByRole('table').count(), 0)
      assert.equal(await page.getByText('No data available to display', { exact: true }).count(), 2)
      await checkAxe(page, 'empty')

      await page.unroute('**/api/metrics')
      await page.route('**/api/metrics', (route) => route.fulfill({ status: 500, json: { detail: 'Test failure' } }))
      await page.reload()
      await page.getByRole('alert').waitFor()
      assert.equal(await page.getByRole('alert').getAttribute('lang'), 'es')
      assert.match(await page.getByRole('alert').textContent(), /No se pudo cargar/)
      assert.equal(await page.locator('[aria-busy="true"]').count(), 0)
      assert.equal(await page.getByRole('status').textContent(), '')
      await checkAxe(page, 'error')
      console.log(`PASS ${viewport.width}px: keyboard, names/roles, tables, icons, loading/empty/error, axe; text ${mutedContrast.toFixed(2)}:1, focus ${focusContrasts.join('/')}:1`)
    } finally {
      await context.close()
    }
  }
} finally {
  await browser?.close()
  await server.close()
}