export enum ResourceType {
  FILE = 'FILE',
  PROMPT = 'PROMPT',
  APPLICATION = 'APPLICATION',
  TOOLSET = 'TOOL_SET',
  CONVERSATION = 'CONVERSATION',
  SKILL = 'SKILL',
  MODEL = 'MODEL',
  APP_TYPE_SCHEMA = 'APP_TYPE_SCHEMA',
  INTERCEPTOR = 'INTERCEPTOR',
  /**
   * Read-only here: registered so the metadata route can list the API-written half of Core's role
   * population. No asset surface writes it through `AssetApi`.
   */
  ROLE = 'ROLE',
  ROUTE = 'ROUTE',
  PROJECT_KEY = 'PROJECT_KEY',
}
