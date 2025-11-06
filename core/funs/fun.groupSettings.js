// folder: core/funs/fun.groupSettings.js

import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import $process from './fun.p.Process.js'

const filePath = path.join($process.env.path.store, 'group.settings.json')

function ensureFileSync() {
  try { fs.mkdirSync(path.dirname(filePath), { recursive: true }) } catch {}
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2))
  }
}

function defaults() {
  return {
    welcomeEnabled: false,
    goodbyeEnabled: false,
    welcomeTemplate: '👋 Bienvenid@ {user} a *{group}* (Somos {members})',
    goodbyeTemplate: '👋 Adiós {user}, ahora somos {members}',
    notifySubject: true,
    notifyDescription: false,
    notifySettings: false,
    lastSubject: undefined,
    lastDescription: undefined
  }
}

export function formatTemplate(tpl, ctx) {
  return String(tpl || '')
    .replaceAll('{user}', `@${(ctx.userJid||'').split('@')[0]}`)
    .replaceAll('{userName}', ctx.userName || '')
    .replaceAll('{group}', ctx.groupName || '')
    .replaceAll('{members}', String(ctx.membersCount ?? ''))
}

export async function getAll() {
  ensureFileSync()
  try {
    const raw = await fsp.readFile(filePath, 'utf-8')
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

export async function getSettings(jid) {
  const all = await getAll()
  return { ...defaults(), ...(all[jid] || {}) }
}

export async function setSettings(jid, patch) {
  ensureFileSync()
  const all = await getAll()
  const current = { ...defaults(), ...(all[jid] || {}) }
  const next = { ...current, ...(patch || {}) }
  all[jid] = next
  await fsp.writeFile(filePath, JSON.stringify(all, null, 2))
  return next
}

export default { getAll, getSettings, setSettings, formatTemplate }
