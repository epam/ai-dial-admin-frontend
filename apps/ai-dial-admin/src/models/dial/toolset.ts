import { ToolsetTransport } from '@/src/types/toolset';
import { DialBaseNamedEntity } from './base-entity';

export interface DialToolset extends DialBaseNamedEntity {
  transport?: ToolsetTransport;
  iconUrl?: string;
  author?: string;
  topics?: string[];
  endpoint?: string | null;
  maxRetryAttempts?: number;
  allowedTools?: string[];
  descriptionKeywords?: string[];
}
