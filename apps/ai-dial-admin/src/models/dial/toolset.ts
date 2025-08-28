import { ToolsetTransport } from '@/src/types/toolset';
import { DialBaseNamedEntity } from './base-entity';

export interface DialToolset extends DialBaseNamedEntity {
  transport?: ToolsetTransport;
  iconUrl?: string;
  author?: string;
  topics?: string[];
  // "endpoint": "http://sample-endpoint/call",
  // "descriptionKeywords": [
  //   "MCP",
  //   "tool"
  // ],
  // "maxRetryAttempts": 3,
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
