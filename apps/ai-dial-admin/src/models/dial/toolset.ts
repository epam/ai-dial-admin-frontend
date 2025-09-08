import { ToolsetTransport } from '@/src/types/toolset';
import { BaseEntity, EntityRoleLimits } from '@/src/models/dial/base-entity';

export interface Toolset extends BaseEntity, EntityRoleLimits {
  transport?: ToolsetTransport;
  allowedTools?: string[];
  descriptionKeywords?: string[];
  iconUrl?: string;
  author?: string;
  endpoint?: string | null;
  maxRetryAttempts?: number;
}

export interface Tool {
  name: string;
  description: string;
}
