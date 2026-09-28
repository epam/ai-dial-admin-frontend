'use client';

import { getConversations } from '@/src/app/[lang]/conversations/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { TreeAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: ConversationFolderProvider, useFolderContext: useConversationFolder } =
  createFolderContext<TreeAssetListItem>(getConversations, 'useConversationFolder');
