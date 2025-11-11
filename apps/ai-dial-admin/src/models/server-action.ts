export interface ServerActionResponse<T extends object = any> {
  success: boolean;
  response?: T;
  errorHeader?: string;
  errorMessage?: string;
  status?: number;
  etag?: string;
}
