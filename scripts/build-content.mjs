#!/usr/bin/env node
/**
 * Turns the survey content sheet into src/content/content.json.
 *
 * Source, in order of preference:
 *   1. A Google Sheet, when CONTENT_SHEET_ID is set. The sheet must be shared
 *      as "Anyone with the link can view"; each tab is fetched as CSV.
 *   2. The Excel workbook content/aptara-survey-content.xlsx, committed to the
 *      repo. Edit and save it in Excel; the next build picks it up.
 *
 * Only rows with Status = Approved are published. Pass --include-drafts to
 * also publish "In review" rows, for previewing content locally.
 *
 * The build stops with a list of problems if anything is missing, too long,
 * or refers to a code that doesn't exist, so a bad edit can't go live.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import readXlsxFile from 'read-excel-file/node'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WORKBOOK = path.join(ROOT, 'content', 'aptara-survey-content.xlsx')
const OUT_FILE = path.join(ROOT, 'src', 'content', 'content.json')

const TABS = ['Settings', 'Questions', 'Answers', 'Sections', 'Result Blocks', 'Rules']
const RULE_MODES = ['Replace', 'Add before', 'Add after', 'Remove']
const INPUT_TYPES = ['Single', 'Multi']
const MULTI = 'MULTI'
const RESULT_ROLES = ['Classification', 'Signal', 'None']

const includeDrafts = process.argv.includes('--include-drafts')
const publishable = new Set(includeDrafts ? ['Approved', 'In review'] : ['Approved'])

// ---------------------------------------------------------------- CSV input

export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/**
 * Converts CSV rows to objects keyed by header. Each tab may start with a
 * merged guidance row above the headers, so the header row is the first one
 * whose first cell matches the expected first column name.
 */
export function toRecords(rows, firstHeader) {
  const headerIndex = rows.findIndex((r) => r[0]?.trim() === firstHeader)
  if (headerIndex === -1) return null
  const headers = rows[headerIndex].map((h) => h.trim())
  return rows
    .slice(headerIndex + 1)
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])))
}

const FIRST_HEADER = {
  Settings: 'Key',
  Questions: 'Order',
  Answers: 'Question code',
  Sections: 'Section',
  'Result Blocks': 'Section',
  Rules: 'Rule ID',
}

/** Cell values as the text a reader sees: numbers without ".0", blanks as ''. */
export function cellText(value) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
}

let workbook
async function loadWorkbook() {
  workbook ??= readXlsxFile(WORKBOOK).catch((err) => {
    throw new Error(`Could not read ${path.relative(ROOT, WORKBOOK)}: ${err.message}`)
  })
  return workbook
}

async function loadTab(tab) {
  const sheetId = process.env.CONTENT_SHEET_ID
  let rows
  if (sheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Could not fetch tab "${tab}" from the Google Sheet (HTTP ${res.status}). Is it shared as "Anyone with the link can view"?`)
    rows = parseCsv((await res.text()).replace(/^\uFEFF/, ''))
  } else {
    const sheet = (await loadWorkbook()).find((s) => s.sheet === tab)
    if (!sheet) throw new Error(`The workbook has no "${tab}" tab. Tab names must stay as they are.`)
    rows = sheet.data.map((row) => row.map(cellText))
  }
  const records = toRecords(rows, FIRST_HEADER[tab])
  if (!records) throw new Error(`Tab "${tab}" has no "${FIRST_HEADER[tab]}" header row.`)
  return records
}

// ------------------------------------------------------- build + validation

/** Parses "Q1=A AND Q4=B" into [{question:'Q1', answer:'A'}, ...]. */
export function parseCondition(when) {
  return when.split(/\s+AND\s+/i).map((part) => {
    const m = part.trim().match(/^([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_]+)$/)
    return m ? { question: m[1], answer: m[2] } : null
  })
}

export function buildContent(tabs, { publishable }) {
  const problems = []
  const live = (r) => publishable.has(r.Status)
  const where = (tab, r, i) => `${tab} row ${i + 1}${r ? ` (${Object.values(r).slice(0, 3).join(' / ')})` : ''}`

  // Settings
  const settings = {}
  for (const r of tabs.Settings.filter(live)) settings[r.Key] = r.Value

  // Questions
  const questions = tabs.Questions.filter(live)
    .map((r) => ({
      code: r['Question code'],
      name: r['Short name'],
      title: r.Question,
      supporting_text: r['Helper text (internal)'],
      landing_blurb: r['Landing page blurb'] ?? '',
      result_role: r['Result role'] || 'None',
      input_type: r['Input type'] || 'Single',
      step: Number(r.Step || r.Order),
      step_heading: r['Step heading'] ?? '',
      display_order: Number(r.Order),
      answers: [],
    }))
    .sort((a, b) => a.display_order - b.display_order)
  const qByCode = new Map()
  questions.forEach((q, i) => {
    if (!q.code) problems.push(`${where('Questions', null, i)}: missing Question code.`)
    if (qByCode.has(q.code)) problems.push(`Questions: code ${q.code} is used twice.`)
    if (!q.title) problems.push(`Questions: ${q.code} has no question text.`)
    if (!Number.isFinite(q.display_order)) problems.push(`Questions: ${q.code} has no numeric Order.`)
    if (!RESULT_ROLES.includes(q.result_role)) problems.push(`Questions: ${q.code} has unknown Result role "${q.result_role}".`)
    if (!INPUT_TYPES.includes(q.input_type)) problems.push(`Questions: ${q.code} has unknown Input type "${q.input_type}". Use Single or Multi.`)
    if (!Number.isFinite(q.step)) problems.push(`Questions: ${q.code} has no numeric Step.`)
    qByCode.set(q.code, q)
  })
  if (questions.length === 0) problems.push('Questions: no approved questions.')
  const classifiers = questions.filter((q) => q.result_role === 'Classification')
  if (classifiers.length !== 1) {
    problems.push(`Questions: exactly one question must have Result role "Classification" (found ${classifiers.length}).`)
  } else if (classifiers[0].input_type === 'Multi') {
    problems.push(`Questions: the Classification question ${classifiers[0].code} must be Single choice.`)
  }

  // Answers
  tabs.Answers.filter(live).forEach((r, i) => {
    const q = qByCode.get(r['Question code'])
    if (!q) {
      problems.push(`${where('Answers', r, i)}: question ${r['Question code']} doesn't exist or isn't approved.`)
      return
    }
    if (q.answers.some((a) => a.code === r['Answer code'])) {
      problems.push(`Answers: ${q.code} has answer code ${r['Answer code']} twice.`)
    }
    if (r['Answer code'] === MULTI) problems.push(`Answers: ${q.code} uses the reserved answer code ${MULTI}.`)
    if (!r['Answer text']) problems.push(`Answers: ${q.code}-${r['Answer code']} has no answer text.`)
    if (!r['Category (short label)']) problems.push(`Answers: ${q.code}-${r['Answer code']} has no category.`)
    q.answers.push({
      code: r['Answer code'],
      text: r['Answer text'],
      category: r['Category (short label)'],
      display_order: Number(r.Order),
    })
  })
  for (const q of questions) {
    q.answers.sort((a, b) => a.display_order - b.display_order)
    if (q.answers.length < 2) problems.push(`Answers: ${q.code} needs at least two approved answers.`)
  }

  // Sections (structural, so every row counts regardless of status)
  const sections = tabs.Sections.map((r) => ({
    id: r.Section,
    label: r['Label on result page'],
    owner: r['Written by question'],
    max_chars: Number(r['Max characters']) || Infinity,
    required: r.Required.toLowerCase() === 'yes',
  }))
  const sectionById = new Map(sections.map((s) => [s.id, s]))
  for (const s of sections) {
    if (!qByCode.has(s.owner)) problems.push(`Sections: "${s.id}" is written by ${s.owner}, which doesn't exist or isn't approved.`)
  }

  // Placeholders like {Q1} or {Q1.text} must point at a real question.
  const checkPlaceholders = (text, label) => {
    for (const [, code] of text.matchAll(/\{([A-Za-z0-9_]+)(?:\.text)?\}/g)) {
      if (!qByCode.has(code)) problems.push(`${label}: placeholder {${code}} refers to an unknown question.`)
    }
  }

  // Result blocks
  const blocks = {}
  tabs['Result Blocks'].filter(live).forEach((r, i) => {
    const s = sectionById.get(r.Section)
    const label = `Result Blocks: ${r.Section} for ${r['Question code']}-${r['Answer code']}`
    if (!s) return problems.push(`${where('Result Blocks', r, i)}: unknown section "${r.Section}".`)
    if (r['Question code'] !== s.owner) {
      return problems.push(`${label}: section "${s.id}" is written by ${s.owner}, not ${r['Question code']}.`)
    }
    const q = qByCode.get(s.owner)
    const isMultiBlock = r['Answer code'] === MULTI
    if (q && isMultiBlock && q.input_type !== 'Multi') {
      return problems.push(`${label}: ${MULTI} blocks are only for Multi questions, and ${q.code} is Single.`)
    }
    if (q && !isMultiBlock && !q.answers.some((a) => a.code === r['Answer code'])) {
      return problems.push(`${label}: answer ${r['Answer code']} doesn't exist.`)
    }
    if (!r.Text) return problems.push(`${label}: approved but the Text is empty.`)
    if (r.Text.length > s.max_chars) problems.push(`${label}: ${r.Text.length} characters, limit is ${s.max_chars}.`)
    for (const field of ['Heading', 'Text', 'Why this matters']) checkPlaceholders(r[field] ?? '', label)
    blocks[s.id] ??= {}
    if (blocks[s.id][r['Answer code']]) problems.push(`${label}: there are two approved blocks.`)
    blocks[s.id][r['Answer code']] = {
      heading: r.Heading ?? '',
      text: r.Text,
      why: r['Why this matters'] ?? '',
    }
  })
  for (const s of sections.filter((x) => x.required)) {
    const q = qByCode.get(s.owner)
    const needed = [...(q?.answers ?? []).map((a) => a.code), ...(q?.input_type === 'Multi' ? [MULTI] : [])]
    for (const code of needed) {
      if (!blocks[s.id]?.[code]) problems.push(`Result Blocks: no approved "${s.id}" text for ${s.owner}-${code}.`)
    }
  }

  // Rules
  const rules = []
  tabs.Rules.filter(live).forEach((r, i) => {
    const label = `Rules: ${r['Rule ID'] || `row ${i + 1}`}`
    const conditions = parseCondition(r['When (all must match)'] ?? '')
    if (conditions.some((c) => c === null)) {
      return problems.push(`${label}: can't read the condition "${r['When (all must match)']}". Use the form Q1=A AND Q4=B.`)
    }
    for (const c of conditions) {
      const q = qByCode.get(c.question)
      if (!q) problems.push(`${label}: question ${c.question} doesn't exist.`)
      else if (!q.answers.some((a) => a.code === c.answer)) problems.push(`${label}: ${c.question} has no answer ${c.answer}.`)
    }
    const s = sectionById.get(r.Section)
    if (!s) problems.push(`${label}: unknown section "${r.Section}".`)
    if (!RULE_MODES.includes(r.Mode)) problems.push(`${label}: Mode must be one of ${RULE_MODES.join(', ')}.`)
    if (!r.Text && r.Mode !== 'Remove') problems.push(`${label}: approved but the Text is empty.`)
    else if (s && r.Mode === 'Replace' && r.Text.length > s.max_chars) {
      problems.push(`${label}: ${r.Text.length} characters, limit for "${s.id}" is ${s.max_chars}.`)
    }
    for (const field of ['Heading', 'Text', 'Why this matters']) checkPlaceholders(r[field] ?? '', label)
    rules.push({
      id: r['Rule ID'],
      when: conditions,
      section: r.Section,
      mode: r.Mode,
      heading: r.Heading ?? '',
      text: r.Text ?? '',
      why: r['Why this matters'] ?? '',
      priority: Number(r.Priority) || 0,
    })
  })

  return {
    problems,
    content: {
      generated_at: new Date().toISOString(),
      includes_drafts: publishable.has('In review'),
      settings,
      questions,
      sections: sections.map((s) => ({ id: s.id, label: s.label, owner: s.owner, required: s.required })),
      blocks,
      rules,
    },
  }
}

// --------------------------------------------------------------------- main

async function main() {
  const tabs = {}
  for (const tab of TABS) tabs[tab] = await loadTab(tab)
  const { problems, content } = buildContent(tabs, { publishable })

  if (problems.length > 0) {
    console.error(`\nThe content sheet has ${problems.length} problem(s), so nothing was published:\n`)
    for (const p of problems) console.error(`  - ${p}`)
    console.error('')
    process.exit(1)
  }

  await mkdir(path.dirname(OUT_FILE), { recursive: true })
  await writeFile(OUT_FILE, JSON.stringify(content, null, 2) + '\n')
  const nBlocks = Object.values(content.blocks).reduce((n, s) => n + Object.keys(s).length, 0)
  console.log(
    `Content OK: ${content.questions.length} questions, ${nBlocks} result blocks, ${content.rules.length} rules` +
      `${content.includes_drafts ? ' (including drafts)' : ''} -> ${path.relative(ROOT, OUT_FILE)}`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
