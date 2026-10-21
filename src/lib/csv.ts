import type { FocusSession } from '../types'

const CSV_HEADERS = [
  'id',
  'intention',
  'kind',
  'plannedSeconds',
  'actualSeconds',
  'status',
  'startedAt',
  'endedAt',
  'createdAt',
]

function escapeCell(value: string | number): string {
  let text = String(value)

  // Spreadsheet applications may evaluate untrusted text as a formula.
  // Prefix risky string cells with an apostrophe; leave numeric fields intact.
  if (typeof value === 'string' && /^[\t\r ]*[=+\-@]/.test(text)) {
    text = "'" + text
  }

  if (/[,"\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"'
  }
  return text
}

export function toCsv(rows: FocusSession[]): string {
  const lines = [CSV_HEADERS.join(',')]
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.intention,
        row.kind,
        row.plannedSeconds,
        row.actualSeconds,
        row.status,
        row.startedAt,
        row.endedAt,
        row.createdAt,
      ].map(escapeCell).join(','),
    )
  }
  return lines.join('\n')
}
