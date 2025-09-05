import { ToolsetTransport } from '@/src/types/toolset';
import { BaseEntity, EntityRoleLimits } from '@/src/models/dial/base-entity';

export interface DialToolset extends BaseEntity, EntityRoleLimits {
  transport?: ToolsetTransport;
  allowedTools?: string[];
  descriptionKeywords?: string[];
  iconUrl?: string;
  author?: string;
  endpoint?: string | null;
  maxRetryAttempts?: number;
}

export interface Tools {
  name: string;
  description: string;
}
