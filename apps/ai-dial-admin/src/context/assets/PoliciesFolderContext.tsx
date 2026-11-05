'use client';

import { getPolicies } from '@/src/app/[lang]/platform-policies/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: PoliciesFolderProvider, useFolderContext: usePoliciesFolder } =
  createFolderContext<PlatformAssetListItem>(getPolicies, 'usePoliciesFolder');
