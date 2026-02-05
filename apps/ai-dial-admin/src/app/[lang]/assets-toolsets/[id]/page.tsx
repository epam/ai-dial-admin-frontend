import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { assetsApi } from '@/src/app/api/api';
import ToolsetView from '@/src/components/Assets/Toolsets/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialFileNodeType } from '@/src/models/dial/file';
import { errorObjLog } from '@/src/server/logger';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string; code?: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let oAuthCode = null;
  let etag = DEFAULT_ETAG;

  let toolsets: AssetToolset[] = [];
  let toolset: AssetToolset | null = null;

  try {
    const searchParams = await params.searchParams;
    oAuthCode = searchParams.code;
    const path = decodeURIComponent(searchParams.path);
    const name = decodeURIComponent((await params.params).id);

    toolset = await assetsApi.getAssetWithEtag(token, path, ResourceType.TOOLSET, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as AssetToolset | null;
    });

    toolsets = ((await assetsApi.getAssetList(token, `${toolset?.folderId}/`, ResourceType.TOOLSET))?.filter(
      (p) => p.nodeType === DialFileNodeType.ITEM && p.name === name,
    ) || []) as AssetToolset[];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch toolset view data');
  }
  if (toolset == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ToolsetFolderProvider>
        <ToolsetView oAuthCode={oAuthCode} etag={etag} originalToolset={toolset} toolsets={toolsets || []} />
      </ToolsetFolderProvider>
    </SaveValidationContextProvider>
  );
}
