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
    if (event.data?.navigateTo) {
      window.location = event.data.navigateTo
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
