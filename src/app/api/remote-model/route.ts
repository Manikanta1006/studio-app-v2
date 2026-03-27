import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for loading STL files from remote URLs
 * Handles CORS and returns binary data safely
 * Usage: /api/remote-model?url=<encoded-url>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const remoteUrl = searchParams.get('url')

    if (!remoteUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      )
    }

    // Validate URL is properly encoded
    let decodedUrl: string
    try {
      decodedUrl = decodeURIComponent(remoteUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL encoding' },
        { status: 400 }
      )
    }

    // Security: Only allow whitelisted domains
    const whitelistedDomains = [
      'smileguide-r2-browser.smileguide-95e.workers.dev',
      'pub-a7470c7e34364419b335fd183c2476e4.r2.dev',
      'smileguide.blob.core.windows.net',
    ]

    const urlObj = new URL(decodedUrl)
    if (!whitelistedDomains.includes(urlObj.hostname)) {
      return NextResponse.json(
        { error: 'Domain not whitelisted' },
        { status: 403 }
      )
    }

    // Fetch from remote URL with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    let response: Response
    try {
      response = await fetch(decodedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream,*/*',
          'User-Agent': 'StudioDental/1.0',
        },
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      console.error(`Remote fetch failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Remote server returned ${response.status}` },
        { status: response.status }
      )
    }

    // Validate content type
    const contentType = response.headers.get('content-type') || ''
    const contentLength = response.headers.get('content-length')

    // For STL files, accept various content types
    if (!contentType.includes('octet-stream') && !contentType.includes('stl') && !contentType.includes('x-stl')) {
      console.warn(`Unexpected content-type: ${contentType}`)
    }

    // Get buffer with size validation
    const arrayBuffer = await response.arrayBuffer()
    
    // Sanity check: STL files shouldn't be > 500MB
    if (arrayBuffer.byteLength > 500 * 1024 * 1024) {
      console.error(`File too large: ${arrayBuffer.byteLength} bytes`)
      return NextResponse.json(
        { error: 'File too large' },
        { status: 413 }
      )
    }

    if (arrayBuffer.byteLength === 0) {
      console.error('Remote file is empty')
      return NextResponse.json(
        { error: 'Remote file is empty' },
        { status: 400 }
      )
    }

    // Return the binary data with proper CORS headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=86400', // Cache for 24h
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Remote model proxy error:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Proxy failed: ${message}` },
      { status: 500 }
    )
  }
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
