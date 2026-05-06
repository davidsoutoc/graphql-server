/*
 * Critical-only Code Scanning fixtures.
 * This file is intentionally insecure and intentionally not imported anywhere.
 */

import { exec } from 'node:child_process'
import url from 'node:url'
import axios from 'axios'
import mysql from 'mysql2'

export function executeUserCommand(requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const command = String(parsedUrl.query.command || '')

  // Built-in CodeQL query: js/command-line-injection
  return exec(`git show ${command}`)
}

export function queryByUserInput(requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const state = String(parsedUrl.query.state || 'open')
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'demo',
    database: 'tickets'
  })

  // Built-in CodeQL query: js/sql-injection
  return connection.query(`SELECT id, title FROM tickets WHERE state = '${state}'`)
}

export async function requestUserSuppliedUrl(requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)
  const target = String(parsedUrl.query.target || 'http://localhost')

  // Built-in CodeQL query: js/request-forgery
  return axios.get(target)
}

export function evaluateUserExpression(requestUrl) {
  const parsedUrl = url.parse(requestUrl, true)

  // Built-in CodeQL query: js/code-injection
  return eval(String(parsedUrl.query.expression || '1 + 1'))
}

export async function triggerCriticalFixtures(requestUrl) {
  executeUserCommand(requestUrl)
  queryByUserInput(requestUrl)
  await requestUserSuppliedUrl(requestUrl)

  return {
    evaluated: evaluateUserExpression(requestUrl)
  }
}
