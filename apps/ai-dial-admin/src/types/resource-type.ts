export enum ResourceType {
  FILE = 'FILE',
  PROMPT = 'PROMPT',
  APPLICATION = 'APPLICATION',
  TOOLSET = 'TOOL_SET',
  CONVERSATION = 'CONVERSATION',
  SKILL = 'SKILL',
  MODEL = 'MODEL',
  APP_TYPE_SCHEMA = 'APP_TYPE_SCHEMA',
  /**
   * Read-only here: registered so the metadata route can list the API-written half of Core's
   * interceptor and role populations. Neither has an asset surface — nothing writes them through
   * `AssetApi`.
   */
  INTERCEPTOR = 'INTERCEPTOR',
  ROLE = 'ROLE',
}
