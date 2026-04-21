import type { AppError, ErrorCode } from '../types/job'

export function buildAppError(error: string, error_code: ErrorCode | null): AppError {
  return { error, error_code }
}
