export interface ServerActionResponse {
  success: boolean;
  response?: unknown;
  errorHeader?: string;
  errorMessage?: string;
}
