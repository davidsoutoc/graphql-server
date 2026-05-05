/*
 * Additional fixtures for GitHub Code Scanning demos.
 * This file is intentionally insecure and intentionally not imported anywhere.
 */

import fs from 'node:fs/promises'
import { exec } from 'node:child_process'
import { pbkdf2Sync, randomBytes } from 'node:crypto'
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
  // Use a password hashing KDF with per-password salt and work factor.
  const iterations = 210000
  const salt = randomBytes(16).toString('hex')
  const derivedKey = pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex')
  return `pbkdf2_sha512$${iterations}$${salt}$${derivedKey}`
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
