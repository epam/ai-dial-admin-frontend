export interface InterceptorTemplate {
  name: string;
  displayName: string;
  description?: string;
  interceptorContainerId?: string;
  completionEndpoint?: string;
  configurationEndpoint?: string;
  interceptors?: string[];
}
