/**
 * RequestRegistry tracks active fetch requests using AbortControllers.
 * When a user logs out, all tracked requests are cancelled to prevent
 * them from completing with stale authentication tokens.
 */
class RequestRegistry {
  private controllers = new Map<string, AbortController>();

  /**
   * Register a new request and get its AbortController.
   * @param id - Unique identifier for the request
   * @returns AbortController to be used with fetch signal
   */
  register(id: string): AbortController {
    const controller = new AbortController();
    this.controllers.set(id, controller);
    return controller;
  }

  /**
   * Unregister a completed request.
   * @param id - Unique identifier for the request
   */
  unregister(id: string): void {
    this.controllers.delete(id);
  }

  /**
   * Cancel all tracked requests and clear the registry.
   * Safe to call multiple times (idempotent).
   */
  cancelAll(): void {
    this.controllers.forEach((controller) => controller.abort());
    this.controllers.clear();
  }
}

export const requestRegistry = new RequestRegistry();
