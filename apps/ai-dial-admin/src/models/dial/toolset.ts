import { ToolsetTransport } from '@/src/types/toolset';
import { DialBaseNamedEntity } from './base-entity';

export interface DialToolset extends DialBaseNamedEntity {
  transport?: ToolsetTransport;
  // "endpoint": "http://sample-endpoint/call",
  // "iconUrl": "https://sample-endpoint/icon.png",
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
  // "author": "test-author",
  // "isPublic": false,
  // "roleLimits": {
  //   "testRole1": {
  //     "minute": "128000",
  //     "day": "2000000"
  //   }
  // }
  // + defaultRoleLimit, defaultRoleShareResourceLimit, roleShareResourceLimits
}
