// folder: core/funs/fun.inspectPlugins.js

import fs from 'fs/promises'
import path from 'path'
import { pathToFileURL } from 'url'

function normalizeCases(value) {
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string')
  if (typeof value === 'string') return [value]
  return []
}

function classify(meta) {
  const types = []
  if (meta.command === true) types.push('command')
  if (meta.stubtype === true) types.push('stubtype')
  if (meta.before === true) types.push('before')
  if (types.length === 0) types.push('other')
  return types
}

export async function inspectPlugins(dirPath, options = {}) {
  const opts = {
    includeNonPrefixed: false,
    ...options
  }
  const result = {
    summary: {
      totalFiles: 0,
      totals: {
        command: 0,
        stubtype: 0,
        before: 0,
        other: 0
      },
      aliasCount: 0,
      commandPluginCount: 0
    },
    items: []
  }

  const entries = await fs.readdir(dirPath).catch(() => [])
  for (const file of entries) {
    if (!file.endsWith('.js')) continue
    result.summary.totalFiles++

    const filePath = path.join(dirPath, file)
    let mod
    try {
      const url = pathToFileURL(filePath)
      mod = await import(`${url.href}?update=${Date.now()}`)
    } catch (e) {
      result.items.push({ fileName: file, error: true, message: String(e) })
      continue
    }

    const exp = mod?.default || mod
    const meta = {
      fileName: file,
      command: !!exp?.command,
      usePrefix: !!exp?.usePrefix,
      stubtype: !!exp?.stubtype,
      before: !!exp?.before,
      index: typeof exp?.index === 'number' ? exp.index : undefined,
      cases: normalizeCases(exp?.case)
    }

    const types = classify(meta)

    // Conteos
    for (const t of types) {
      if (result.summary.totals[t] !== undefined) {
        result.summary.totals[t] += 1
      }
    }

    if (meta.command && (opts.includeNonPrefixed || meta.usePrefix)) {
      result.summary.commandPluginCount += 1
      result.summary.aliasCount += meta.cases.length
    }

    result.items.push({ ...meta, types })
  }

  return result
}

export default { inspectPlugins }
