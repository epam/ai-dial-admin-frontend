import { ErrorObject } from '@/src/utils/api/error';

/**
 * Maps an HTTP status code to its conventional reason phrase, used as the error
 * header when DIAL Core returns no structured error code. Mirrors the phrases the
 * admin backend produced via Spring's `ErrorView`.
 */
const STATUS_REASON: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  412: 'Precondition Failed',
  500: 'Internal Server Error',
};

export const getStatusReason = (status: number): string => {
  return STATUS_REASON[status] ?? 'Request error';
};

interface NestedCoreError {
  message?: string;
  code?: string;
  type?: string;
}

interface ValidationWarning {
  field?: string;
  message?: string;
}

interface RawCoreError {
  message?: string;
  error?: string | NestedCoreError;
  code?: string;
  validationWarnings?: ValidationWarning[];
}

/**
 * `errorHeader` DIAL Core sets for its cross-reference/overlap validation failures
 * (`ConfigResourceController.checkCrossReferences`, HTTP 422 with a `validationWarnings` body) —
 * a stable marker callers can check for instead of the generic status-only fallback message.
 */
export const VALIDATION_WARNINGS_ERROR_HEADER = 'Validation Failed';

/**
 * Normalizes a DIAL Core error body into the flat `{ error, message, status }`
 * shape the frontend error helpers (`getError` / `getErrorMessage`) understand.
 *
 * The admin backend used to flatten Core's response (plain text or JSON) into a
 * Spring `ErrorView`; calling Core directly means the frontend now receives Core's
 * raw body, which may be plain text or a nested `{ error: { message } }` envelope.
 * This reproduces the backend's flattening so error messages are preserved.
 */
export const normalizeCoreError = (body: string, status: number): ErrorObject => {
  const fallbackHeader = getStatusReason(status);

  let parsed: RawCoreError | undefined;
  try {
    const json = JSON.parse(body);
    if (json && typeof json === 'object') {
      parsed = json as RawCoreError;
    }
  } catch {
    // Not JSON — treat the whole body as the message (plain-text error).
  }

  if (!parsed) {
    const text = body?.trim();
    return { error: fallbackHeader, message: text || `Error status: ${status}`, status };
  }

  if (parsed.validationWarnings?.length) {
    const message = parsed.validationWarnings
      .map((warning) => [warning.field, warning.message].filter(Boolean).join(': '))
      .filter(Boolean)
      .join('; ');
    return { error: VALIDATION_WARNINGS_ERROR_HEADER, message: message || fallbackHeader, status };
  }

  const nested = typeof parsed.error === 'object' ? parsed.error : undefined;
  const topLevelError = typeof parsed.error === 'string' ? parsed.error : undefined;

  const message = nested?.message ?? parsed.message;
  const header = nested?.code ?? nested?.type ?? topLevelError ?? parsed.code;

  return {
    error: header || fallbackHeader,
    message: message || `Error status: ${status}`,
    status,
  };
};
