import { ToolsetTransport } from '@/src/types/toolset';
import { BaseEntity } from './base-entity';

export interface DialToolset extends BaseEntity {
  transport?: ToolsetTransport;
  iconUrl?: string;
  author?: string;
  topics?: string[];
  maxRetryAttempts?: number;
  // "endpoint": "http://sample-endpoint/call",
  // "descriptionKeywords": [
  //   "MCP",
  //   "tool"
  // ],
  // "transport": "http", // HTTP or SSE
  // "allowedTools": [
  //   "first",
  //   "second"
  // ],
  // "isPublic": false,
  // "roleLimits": {
  //   "testRole1": {
  //     "minute": "128000",
  //     "day": "2000000"
  //   }
  // }
  // + defaultRoleLimit, defaultRoleShareResourceLimit, roleShareResourceLimits
}
