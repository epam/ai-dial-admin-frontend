export interface ServerActionResponse<T extends object = any> {
  success: boolean;
  response?: T;
  requestId?: string;
  errorHeader?: string;
  errorMessage?: string;
  status?: number;
  etag?: string;
}
