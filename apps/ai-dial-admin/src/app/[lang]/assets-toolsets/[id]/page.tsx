import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { assetsApi } from '@/src/app/api/api';
import ToolsetView from '@/src/components/Assets/Toolsets/View';
import Page403 from '@/src/components/Page403/Page403';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialFileNodeType } from '@/src/models/dial/file';
import { logger } from '@/src/server/logger';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';
import { AssetToolset } from '@/src/models/dial/toolset';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let etag = DEFAULT_ETAG;

  let toolsets: AssetToolset[] = [];
  let toolset: AssetToolset | null = null;

  try {
    const path = decodeURIComponent((await params.searchParams).path);
    const name = decodeURIComponent((await params.params).id);

    toolset = await assetsApi.getAssetWithEtag(token, path, ResourceType.TOOLSET, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as AssetToolset | null;
    });

    if (toolset === void 0) {
      return <Page403 />;
    }

    toolsets = ((await assetsApi.getAssetList(token, `${toolset?.folderId}/`, ResourceType.TOOLSET))?.filter(
      (p) => p.nodeType === DialFileNodeType.ITEM && p.name === name,
    ) || []) as AssetToolset[];
  } catch (e) {
    logger.error('Getting toolset view data error', e);
  }
  if (toolset == null) {
    redirect(ApplicationRoute.AssetsToolsets);
  }

  return (
    <SaveValidationContextProvider>
      <ToolsetFolderProvider>
        <ToolsetView etag={etag} originalToolset={toolset} toolsets={toolsets || []} />
      </ToolsetFolderProvider>
    </SaveValidationContextProvider>
  );
}
