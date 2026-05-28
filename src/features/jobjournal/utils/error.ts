import type { JobJournalErrorCode } from '../types';

/**
 * Parse a stored last_error value of the form "CODE|message" into its parts.
 * Returns { code, message }. If lastError is null/empty, returns { code: null, message: null }.
 */
export function parseStageLastError(lastError: string | null | undefined): { code: JobJournalErrorCode | null; message: string | null } {
  if (!lastError) return { code: null, message: null };
  const parts = String(lastError).split('|');
  if (parts.length === 0) return { code: null, message: String(lastError) };
  const codePart = parts[0] as JobJournalErrorCode | string;
  const msgPart = parts.slice(1).join('|') || null;

  // Validate codePart against known codes by using a whitelist
  const knownCodes = new Set<JobJournalErrorCode>([
    'PRECONDITION_FAILED',
    'MODEL_UNAVAILABLE',
    'TIMEOUT',
    'IO_ERROR',
    'VECTOR_MISSING',
    'VECTOR_UNAVAILABLE',
    'NOT_FOUND',
    'UNKNOWN',
  ]);

  const code = knownCodes.has(codePart as JobJournalErrorCode) ? (codePart as JobJournalErrorCode) : null;
  const message = msgPart || null;
  return { code, message };
}
