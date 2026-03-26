import { SelectOption } from '@epam/ai-dial-ui-kit';

export enum SourceType {
  ENDPOINT_MCP_CONTAINER = 'endpoint_mcp_container',
  APP_RUNNER = 'app_runner',
}

export const TRANSPORTS: SelectOption[] = [{ label: 'HTTP', value: 'http' }];
