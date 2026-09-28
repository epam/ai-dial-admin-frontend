export interface ServerActionResponse<T extends object = any> {
  success: boolean;
  response?: T;
  requestId?: string;
  errorHeader?: string;
  errorMessage?: string;
  status?: number;
  etag?: string;
}

// `requestId` is the response's `traceparent`, which not every deployment emits.
export interface ReadFailure {
  errorHeader?: string;
  errorMessage?: string;
  requestId?: string;
}
