'use client';

import { getPolicyAssignments } from '@/src/app/[lang]/platform-policy-assignments/actions';
import { createFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';

export const { Provider: PolicyAssignmentsFolderProvider, useFolderContext: usePolicyAssignmentsFolder } =
  createFolderContext<PlatformAssetListItem>(getPolicyAssignments, 'usePolicyAssignmentsFolder');
