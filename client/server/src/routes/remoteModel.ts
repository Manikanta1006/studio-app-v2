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

    let parsedUrl: URL
    try {
      parsedUrl = new URL(rawUrl)
    } catch {
      response.status(400).json({ success: false, error: 'Invalid URL format' })
      return
    }

    if (parsedUrl.protocol !== 'https:' || !allowedHosts.has(parsedUrl.host)) {
      response.status(400).json({ success: false, error: 'Remote model host is not allowed' })
      return
    }

    console.log(`[PROXY] Fetching STL from: ${parsedUrl.toString()}`)

    const upstream = await fetch(parsedUrl.toString(), {
      headers: {
        Accept: 'application/octet-stream,*/*',
        'User-Agent': '3d-dental-studio-proxy/1.0',
      },
      redirect: 'follow', // Explicitly follow redirects
    })

    if (!upstream.ok) {
      console.error(`[PROXY] Remote returned ${upstream.status}: ${upstream.statusText}`)
      response.status(502).json({
        success: false,
        error: `Failed to fetch remote model: ${upstream.status} ${upstream.statusText}`,
      })
      return
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
    const contentLength = upstream.headers.get('content-length')
    const fileName = parsedUrl.pathname.split('/').pop() ?? 'remote-model.stl'

    // Read entire response into buffer
    const arrayBuffer = await upstream.arrayBuffer()
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.error('[PROXY] Remote returned empty buffer')
      response.status(502).json({ success: false, error: 'Remote model returned empty data' })
      return
    }

    console.log(`[PROXY] Successfully fetched ${arrayBuffer.byteLength} bytes`)

    response.status(200)
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin ?? '*')
    response.setHeader('Vary', 'Origin')
    response.setHeader('Content-Type', 'application/octet-stream')
    response.setHeader('Content-Length', arrayBuffer.byteLength)
    response.setHeader('Cache-Control', 'public, max-age=3600')
    response.setHeader('Content-Disposition', `inline; filename="${fileName}"`)

    // Send as binary buffer
    response.end(Buffer.from(arrayBuffer))
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
