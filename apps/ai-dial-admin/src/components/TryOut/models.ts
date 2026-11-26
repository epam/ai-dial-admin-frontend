/** What the shared response panel needs from any Try out response; richer responses satisfy it structurally. */
export interface TryOutResponseData {
  body?: unknown;
  streaming?: boolean;
  events?: unknown[];
}
