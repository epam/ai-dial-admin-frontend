import { notFound } from 'next/navigation';

import PlatformToolsetView from '@/src/components/Assets/Platform/Toolsets/View';
import ToolsetView from '@/src/components/Assets/Toolsets/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Asset, AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialFileNodeType } from '@/src/models/dial/file';
import { errorObjLog } from '@/src/server/logger';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { getPlatformToolset, getToolset, getToolsets } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path?: string; code?: string }>;
}) {
  let oAuthCode = null;
  let etag = DEFAULT_ETAG;

  let toolsets: AssetToolset[] = [];
  let toolset: AssetToolset | null = null;

  // A `path` query param means this is a public-bucket (versioned, folder-nested) toolset; its
  // absence means a platform-bucket one — flat, identified by name alone (design.md D3/D5).
  const searchParams = await params.searchParams;
  oAuthCode = searchParams.code;
  const rawPath = searchParams.path;
  const isPlatformBucket = !rawPath;
  const name = decodeURIComponent((await params.params).id);

  try {
    if (isPlatformBucket) {
      const path = `${PLATFORM_ROOT_FOLDER}/${name}`;

      toolset = await getPlatformToolset(path, etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return (res?.response as unknown as AssetToolset) || null;
      });
    } else {
      const path = decodeURIComponent(rawPath as string);

      toolset = await getToolset(path, etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as AssetToolset | null;
      });

      toolsets = ((await getToolsets(toolset?.folderId as string))?.filter(
        (p) => (p as Asset).nodeType === DialFileNodeType.ITEM && p.name === name,
      ) || []) as AssetToolset[];
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch toolset view data');
  }
  if (toolset == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      {isPlatformBucket ? (
        <PlatformToolsetView oAuthCode={oAuthCode} etag={etag} originalToolset={toolset} />
      ) : (
        <ToolsetView oAuthCode={oAuthCode} etag={etag} originalToolset={toolset} toolsets={toolsets || []} />
      )}
    </SaveValidationContextProvider>
  );
}
