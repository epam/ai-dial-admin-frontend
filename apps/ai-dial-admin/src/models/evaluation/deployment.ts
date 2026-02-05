import { DialRoute } from '@/src/models/dial/route';

export interface Deployment {
  $type: string;
  deploymentId: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  routes?: Record<string, DialRoute>;
}
