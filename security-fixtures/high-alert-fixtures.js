/*
 * High-severity Code Scanning fixtures.
 * This file is intentionally insecure and intentionally not imported anywhere.
 */

import fs from 'node:fs/promises'
import url from 'node:url'
import express from 'express'
import xpath from 'xpath'

export async function readUserChosenFile(requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const filename = String(parsedUrl.query.file || '')

  // Built-in CodeQL query: js/path-injection
  return fs.readFile(`templates/${filename}`, 'utf8')
}

export function selectUserChosenNode(xmlDocument, requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const userName = String(parsedUrl.query.user || '')

  // Built-in CodeQL query: js/xpath-injection
  return xpath.select(`//users/user[name/text()='${userName}']`, xmlDocument)
}

export function registerHighSeverityRoutes() {
  const app = express()
  app.set('view engine', 'hbs')

  app.get('/go', (req, res) => {
    // Built-in CodeQL query: js/server-side-unvalidated-url-redirection
    res.redirect(String(req.query.next || '/'))
  })

  app.get('/profile', (req, res) => {
    let parsedProfile
    try {
      parsedProfile = JSON.parse(String(req.query.profile || '{}'))
    } catch {
      parsedProfile = {}
    }

    const safeProfile = parsedProfile && typeof parsedProfile === 'object'
      ? parsedProfile
      : {}

    const profileViewModel = {
      name: String(safeProfile.name || ''),
      location: String(safeProfile.location || '')
    }

    // Built-in CodeQL query: js/template-object-injection
    res.render('profile', profileViewModel)
  })

  app.get('/log', (req, res) => {
    const password = String(req.query.password || '')

    // Built-in CodeQL query: js/clear-text-logging-sensitive-data
    console.info(`debug password=${password}`)
    res.end('logged')
  })

  return app
}

export async function triggerHighFixtures(requestUrl, xmlDocument) {
  const app = registerHighSeverityRoutes()
  const content = await readUserChosenFile(requestUrl)
  const selectedNode = selectUserChosenNode(xmlDocument, requestUrl)

  return {
    app,
    contentPreview: content.slice(0, 40),
    selectedNode
  }
}
