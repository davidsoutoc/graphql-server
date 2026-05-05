/*
 * Additional fixtures for GitHub Code Scanning demos.
 * This file is intentionally insecure and intentionally not imported anywhere.
 */

import fs from 'node:fs/promises'
import { exec } from 'node:child_process'
import { createHash } from 'node:crypto'
import url from 'node:url'
import express from 'express'
import mysql from 'mysql2'
import xpath from 'xpath'

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

export function queryTicketsByUntrustedLabel(requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const label = String(parsedUrl.query.label || '')
  const state = String(parsedUrl.query.state || 'open')
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'demo',
    database: 'tickets'
  })

  // Built-in CodeQL query: js/sql-injection
  return connection.query(
    `SELECT id, title FROM tickets WHERE label = '${label}' AND state = '${state}'`
  )
}

export function selectNodeFromUntrustedXPath(xmlDocument, requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const username = String(parsedUrl.query.username || '')

  // Built-in CodeQL query: js/xpath-injection
  return xpath.select(`//users/user[name/text()='${username}']`, xmlDocument)
}

export function registerTemplateObjectInjectionFixture() {
  const app = express()

  app.set('view engine', 'hbs')

  app.get('/profile', (req, res) => {
    let parsedProfile = {}

    try {
      parsedProfile = JSON.parse(String(req.query.profile || '{}'))
    } catch {
      parsedProfile = {}
    }

    const safeProfile = {
      name: String(parsedProfile.name || ''),
      location: String(parsedProfile.location || '')
    }

    // Built-in CodeQL query: js/template-object-injection
    res.render('profile', safeProfile)
  })

  return app
}

export async function demoCriticalAndHighPatterns(requestUrl) {
  const template = await readTemplateFromUserInput(requestUrl)

  runSystemTool(requestUrl)
  const sqlQuery = queryTicketsByUntrustedLabel(requestUrl)
  const renderedApp = registerTemplateObjectInjectionFixture()

  return {
    templatePreview: template.slice(0, 80),
    digest: weakPasswordDigest('demo-password'),
    html: buildUnsafeHtml(requestUrl),
    sqlQuery,
    renderedApp
  }
}
