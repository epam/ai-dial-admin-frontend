import { ServerActionResponse } from '@/src/models/server-action';

/**
 * Whether a failed response never reached the service. Every answer the service gives carries an HTTP `status`;
 * the envelope `useProtectedRequest` builds for a rejected call does not, so it has no words of the service to show.
 * `is-unreachable-response.spec.ts` runs the hook to pin that contract.
 */
export const isUnreachableResponse = (res: ServerActionResponse): boolean => !res.success && res.status == null;
