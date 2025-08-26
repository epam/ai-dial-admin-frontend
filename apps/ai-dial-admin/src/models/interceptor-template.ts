export interface InterceptorTemplate {
  name: string;
  displayName?: string;
  description?: string;
  completionEndpoint?: string;
  configurationEndpoint?: string;
  interceptors?: string[];
  updatedAt?: number;
  createdAt?: number;
}
