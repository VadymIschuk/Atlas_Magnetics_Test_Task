import { buildAppError } from './app-error'

function parseCsvHeader(headerLine: string): string[] {
  return headerLine
    .split(',')
    .map((column) => column.trim().replace(/^"|"$/g, '').toLowerCase())
}

export async function validateCsvFiles(files: File[]) {
  for (const file of files) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return buildAppError(`File "${file.name}" must have a .csv extension.`, 'invalid_csv_structure')
    }

    const headerChunk = await file.slice(0, 4096).text()
    const [headerLine] = headerChunk
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (!headerLine) {
      return buildAppError(`File "${file.name}" is empty.`, 'empty_file')
    }

    const headerColumns = parseCsvHeader(headerLine)
    const hasResultColumn = headerColumns.includes('result')
    const hasAxisColumn = ['test_id', 'test_name', 'index'].some((column) =>
      headerColumns.includes(column),
    )

    if (!hasResultColumn || !hasAxisColumn) {
      return buildAppError(
        `File "${file.name}" must contain "result" and one of "test_id", "test_name", or "index".`,
        'invalid_columns',
      )
    }
  }

  return null
}
