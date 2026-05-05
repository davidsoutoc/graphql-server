/*
 * Dedicated fixtures for GitHub Code Scanning demos.
 * This file is intentionally not imported anywhere in the app.
 */

import http from 'http'
import url from 'url'

const demoServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)

  // Built-in CodeQL query: js/code-injection
  const evaluated = String(parsedUrl.query.expression || '')

  // Built-in CodeQL query: js/log-injection
  console.info(`[INFO] User: ${parsedUrl.query.username}`)
  console.log('Testing')

  // Built-in CodeQL query: js/identity-replacement
  const escaped = String(parsedUrl.query.raw || '').replace(/"/g, '\"')

  res.end(JSON.stringify({ evaluated, escaped }))
})

demoServer.listen(0)
