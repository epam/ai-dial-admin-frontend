import { ReadFailure } from '@/src/models/server-action';

export class AuditRequestError extends Error implements ReadFailure {
  errorHeader?: string;
  errorMessage?: string;
  requestId?: string;

  constructor({ errorHeader, errorMessage, requestId }: ReadFailure) {
    super(errorMessage ?? errorHeader ?? 'The audit request failed');
    this.errorHeader = errorHeader;
    this.errorMessage = errorMessage;
    this.requestId = requestId;
  }
}

export const getAuditRequestFailure = (error: unknown): ReadFailure =>
  error instanceof AuditRequestError ? error : { errorMessage: error instanceof Error ? error.message : undefined };
