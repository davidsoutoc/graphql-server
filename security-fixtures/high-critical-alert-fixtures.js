/*
 * Additional fixtures for GitHub Code Scanning demos.
 * This file is intentionally insecure and intentionally not imported anywhere.
 */

import fs from 'node:fs/promises'
import { exec } from 'node:child_process'
import { createHash } from 'node:crypto'
import url from 'node:url'

export async function readTemplateFromUserInput(requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const templateName = String(parsedUrl.query.template || '')

  // Intentionally insecure: user-controlled path segment.
  return fs.readFile(`templates/${templateName}`, 'utf8')
}

export function runSystemTool(requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const toolArgument = String(parsedUrl.query.arg || '')

  // Intentionally insecure: user-controlled shell command.
  exec(`git log --oneline ${toolArgument}`, (error, stdout) => {
    if (error) {
      console.error(error.message)
      return
    }

    console.log(stdout)
  })
}

export function weakPasswordDigest(password) {
  // Intentionally insecure: weak hash for scanner coverage.
  return createHash('md5').update(password).digest('hex')
}

export function buildUnsafeHtml(requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const displayName = String(parsedUrl.query.name || '')

  // Intentionally insecure: direct HTML construction from user input.
  return `<section><h1>${displayName}</h1></section>`
}

export async function demoCriticalAndHighPatterns(requestUrl) {
  const template = await readTemplateFromUserInput(requestUrl)

  runSystemTool(requestUrl)

  return {
    templatePreview: template.slice(0, 80),
    digest: weakPasswordDigest('demo-password'),
    html: buildUnsafeHtml(requestUrl)
  }
}
