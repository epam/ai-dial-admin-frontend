import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { SelectOption } from '@epam/ai-dial-ui-kit';
import { ToolsetTransport } from '../types/toolset';

export const ONLY_HTTP_TRANSPORTS: SelectOption[] = [{ label: 'HTTP', value: ToolsetTransport.HTTP }];

export const CONTAINER_TRANSPORTS: SelectOption[] = [
  { label: 'HTTP', value: CONTAINER_TRANSPORT.HTTP },
  { label: 'SSE', value: CONTAINER_TRANSPORT.SSE, description: '(deprecated)' },
];

export const TOOLSET_TRANSPORTS: SelectOption[] = [
  { value: ToolsetTransport.HTTP, label: ToolsetTransport.HTTP.toUpperCase() },
  { value: ToolsetTransport.SSE, label: ToolsetTransport.SSE.toUpperCase(), description: '(deprecated)' },
];
