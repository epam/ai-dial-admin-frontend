import { DialPrompt } from './dial/prompt';

export interface ParsedPrompts {
  prompts: DialPrompt[];
}

export interface PromptImportGridData {
  name: string;
  version: string;
  promptName: string;
  existingNames?: string[];
  index: number;
  invalid?: boolean;
  extension?: string;
}
