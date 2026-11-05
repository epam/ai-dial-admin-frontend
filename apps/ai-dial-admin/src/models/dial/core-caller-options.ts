/** One entry of Core's caller-scoped `GET /openai/{models,applications}` lists. */
export interface CoreCallerDeployment {
  id: string;
  display_name?: string;
}

export interface CoreCallerDeploymentsResponse {
  data?: CoreCallerDeployment[];
}
