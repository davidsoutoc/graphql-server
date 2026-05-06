import http from 'http'
import url from 'url'

export function isValidHexColor(color) {
  // Built-in CodeQL query: js/overly-large-range
  return /^#[0-9a-fA-f]{6}$/i.test(color)
}

export function escapeQuotes(raw) {
  // Built-in CodeQL query: js/identity-replacement
  return raw.replace(/"/g, '\"')
}

export function evaluateExpression(expression) {
  // Built-in CodeQL query: js/code-injection
  // Avoid executing user-controlled input.
  return String(expression ?? '')
}

export function buildDynamicRegex(userPattern, candidate) {
  // Built-in CodeQL query: js/regex-injection
  return new RegExp(userPattern).test(candidate)
}

export const demoServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)

  const evaluationResult = evaluateExpression(parsedUrl.query.expression)
  const regexResult = buildDynamicRegex(parsedUrl.query.pattern, parsedUrl.query.input || '')
  const escapedValue = escapeQuotes(String(parsedUrl.query.raw || ''))

  // Built-in CodeQL query: js/log-injection
  console.info(`[INFO] User: ${parsedUrl.query.username}`)

  res.end(JSON.stringify({
    evaluationResult,
    regexResult,
    escapedValue,
    validColor: isValidHexColor(String(parsedUrl.query.color || ''))
  }))
})

demoServer.listen(0)
