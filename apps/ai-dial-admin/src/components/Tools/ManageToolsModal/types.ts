import { Tool } from '@/src/models/dial/toolset';
import { FieldError } from '@/src/models/error';

export type CustomToolConfig = {
  name: string;
  isAllowed: boolean;
  error: FieldError | null;
};

export type ToolConfig = Tool & { isAllowed: boolean };
