import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
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
   * Interfaces DIAL Core reports this deployment as supporting. Populated only by the
   * single-deployment endpoints; the deployment listing returns a short projection without it.
   * Absent means "not reported", never "supports nothing".
   *
   * Core does not report this for models fetched through its `/openai/...` API, so `features` is
   * the signal that actually arrives for them.
   */
  interfaces?: DeploymentInterfaceType[];
  features?: DeploymentFeatures;
}

/**
 * DIAL Core's per-deployment feature flags, passed through verbatim by the Evaluation Framework
 * (its DTO types the property as a free-form object). Field names are Core's wire names, so they
 * stay snake_case and keep Core's spelling rather than this repo's boolean naming convention.
 *
 * Only the flags this app reads are declared; add others as they are needed.
 */
export interface DeploymentFeatures {
  responses_api?: boolean;
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
