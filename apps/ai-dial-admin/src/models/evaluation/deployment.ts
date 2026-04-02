import { DialRoute } from '@/src/models/dial/route';

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
