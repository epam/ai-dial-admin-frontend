'use client';

import { getConversations } from '@/src/app/[lang]/conversations/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { Asset } from '@/src/models/dial/deployment-asset';

export const { Provider: ConversationFolderProvider, useFolderContext: useConversationFolder } = createFolderContext(
  getConversations as (path: string) => Promise<Asset[] | null | undefined>,
  'useConversationFolder',
);
