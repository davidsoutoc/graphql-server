/*
 * Medium-severity Code Scanning fixtures.
 * This file is intentionally insecure and intentionally not imported anywhere.
 */

import url from 'node:url'
import express from 'express'

export function testUserRegex(requestUrl, candidate) {
  const parsedUrl = url.parse(requestUrl, true)
  const pattern = String(parsedUrl.query.pattern || '')

  // Built-in CodeQL query: js/regex-injection
  return new RegExp(pattern).test(candidate)
}

export function registerMediumSeverityRoutes() {
  const app = express()

  app.get('/cookie', (req, res) => {
    const token = String(req.query.token || '')

    // Built-in CodeQL query: js/clear-text-cookie
    res.cookie('session_token', token)
    res.end('cookie set')
  })

  return app
}

export function registerMissingOriginHandler() {
  if (typeof window === 'undefined') {
    return null
  }

  // Built-in CodeQL query: js/missing-origin-check
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) {
      return
    }

    const navigateTo = event.data?.navigateTo
    if (!navigateTo) {
      return
    }

    try {
      const targetUrl = new URL(String(navigateTo), window.location.origin)
      const isHttp = targetUrl.protocol === 'http:' || targetUrl.protocol === 'https:'
      const isSameOrigin = targetUrl.origin === window.location.origin

      if (isHttp && isSameOrigin) {
        window.location = targetUrl.href
      }
    } catch {
      // Ignore invalid URLs
    }
  })

  return true
}

export function triggerMediumFixtures(requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const app = registerMediumSeverityRoutes()
  const hasHandler = registerMissingOriginHandler()

  return {
    app,
    regexResult: testUserRegex(requestUrl, String(parsedUrl.query.input || '')),
    hasHandler
  }
}
