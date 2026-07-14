/**
 * Ports the admin backend's `SimpleCircuitBreaker` for multi-file import: aborts the
 * remaining batch once a configured number of *consecutive* per-file failures occurs.
 * A success (or a handled "already exists" skip) resets the count.
 *
 * The backend's configured threshold (`files.import.consecutiveErrorsThreshold`) value
 * itself is not available to this frontend-only migration; this constant is a reasonable
 * default and should be reconciled with the backend's actual configured value if it
 * differs materially in practice.
 */
export const FILES_IMPORT_CIRCUIT_BREAKER_THRESHOLD = 5;

export class ConsecutiveFailureCircuitBreaker {
  private consecutiveFailures = 0;

  constructor(private readonly threshold: number) {}

  isOpen(): boolean {
    return this.consecutiveFailures >= this.threshold;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(): void {
    this.consecutiveFailures += 1;
  }
}
