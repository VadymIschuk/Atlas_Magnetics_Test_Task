import type { AppError, ErrorCode } from '../types/job'

function buildAppError(error: string, error_code: ErrorCode | null): AppError {
  return { error, error_code }
}

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

export function mergeSelectedFiles(currentFiles: File[], nextFiles: File[]) {
  const mergedFiles = [...currentFiles]

  for (const nextFile of nextFiles) {
    const alreadySelected = mergedFiles.some(
      (currentFile) =>
        currentFile.name === nextFile.name &&
        currentFile.size === nextFile.size &&
        currentFile.lastModified === nextFile.lastModified,
    )

    if (!alreadySelected) {
      mergedFiles.push(nextFile)
    }
  }

  return mergedFiles
}
