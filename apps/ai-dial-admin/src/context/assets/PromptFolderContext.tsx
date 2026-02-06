'use client';

import { getPrompts } from '@/src/app/[lang]/prompts/actions';
import { DialPrompt } from '@/src/models/dial/prompt';
import { createFolderContext } from './AssetsFolderContext';

export const { Provider: PromptFolderProvider, useFolderContext: usePromptFolder } = createFolderContext(
  getPrompts as (path: string) => Promise<DialPrompt[] | null | undefined>,
  'usePromptFolder',
);
