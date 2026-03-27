import { Router } from 'express'

const router = Router()
const allowedHosts = new Set([
  'pub-a7470c7e34364419b335fd183c2476e4.r2.dev',
  'smileguide-r2-browser.smileguide-95e.workers.dev'
])

router.get('/', async (request, response) => {
  try {
    const rawUrl = String(request.query.url ?? '')

    if (!rawUrl) {
      response.status(400).json({ success: false, error: 'Missing url query parameter' })
      return
    }

    const parsedUrl = new URL(rawUrl)

    if (parsedUrl.protocol !== 'https:' || !allowedHosts.has(parsedUrl.host)) {
      response.status(400).json({ success: false, error: 'Remote model host is not allowed' })
      return
    }

    const upstream = await fetch(parsedUrl.toString(), {
      headers: {
        Accept: 'application/octet-stream,*/*',
        'User-Agent': '3d-dental-studio-proxy/1.0',
      },
    })

    if (!upstream.ok) {
      response.status(502).json({
        success: false,
        error: `Failed to fetch remote model: ${upstream.status} ${upstream.statusText}`,
      })
      return
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
    const contentLength = upstream.headers.get('content-length')
    const fileName = parsedUrl.pathname.split('/').pop() ?? 'remote-model.stl'
    const body = upstream.body

    if (!body) {
      response.status(502).json({ success: false, error: 'Remote model returned an empty body' })
      return
    }

    response.status(200)
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin ?? '*')
    response.setHeader('Vary', 'Origin')
    response.setHeader('Content-Type', contentType)

    if (contentLength) {
      response.setHeader('Content-Length', contentLength)
    }

    response.setHeader('Cache-Control', 'public, max-age=3600')
    response.setHeader('Content-Disposition', `inline; filename="${fileName}"`)
    const reader = body.getReader()

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      response.write(Buffer.from(value))
    }

    response.end()
  } catch (error) {
    console.error('Error proxying remote model:', error)

    if (!response.headersSent) {
      response.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to proxy remote model',
      })
      return
    }

    response.end()
  }
})

export default router
