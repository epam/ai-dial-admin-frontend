import { DeploymentApiInterface } from '@/src/models/dial/interfaces';
import { DialRoute } from '@/src/models/dial/route';

export enum DeploymentType {
  Application = 'dial-application',
  Model = 'dial-model',
}

export interface Deployment {
  $type: string;
  deploymentId: string;
  displayName?: string;
  version?: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  routes?: Record<string, DialRoute>;
  /**
   * The APIs this deployment declares support for. Populated only by the single-deployment
   * endpoints; the deployment listing returns a short projection without it, so absent means
   * "not reported" rather than "supports nothing".
   */
  interfaces?: DeploymentApiInterface[];
}

export interface ToolsetDeployment extends Deployment {
  transport?: string;
  allowedTools?: string[];
}

export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}
