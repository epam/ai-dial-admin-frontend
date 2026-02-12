import { Tool } from '@/src/models/dial/toolset';
import { FieldError } from '@/src/models/error';

export interface CustomToolConfig {
  id: string;
  name: string;
  isAllowed: boolean;
  error: FieldError | null;
}

export type ToolConfig = Tool & { isAllowed: boolean; id: string };
