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
