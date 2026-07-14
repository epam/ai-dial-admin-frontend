import { notFound } from 'next/navigation';

import ToolsetView from '@/src/components/Assets/Toolsets/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Asset, AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialFileNodeType } from '@/src/models/dial/file';
import { errorObjLog } from '@/src/server/logger';
import { getToolset, getToolsets } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string; code?: string }>;
}) {
  let oAuthCode = null;
  let etag = DEFAULT_ETAG;

  let toolsets: AssetToolset[] = [];
  let toolset: AssetToolset | null = null;

  try {
    const searchParams = await params.searchParams;
    oAuthCode = searchParams.code;
    const path = decodeURIComponent(searchParams.path);
    const name = decodeURIComponent((await params.params).id);

    toolset = await getToolset(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as AssetToolset | null;
    });

    toolsets = ((await getToolsets(toolset?.folderId as string))?.filter(
      (p) => (p as Asset).nodeType === DialFileNodeType.ITEM && p.name === name,
    ) || []) as AssetToolset[];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch toolset view data');
  }
  if (toolset == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ToolsetView oAuthCode={oAuthCode} etag={etag} originalToolset={toolset} toolsets={toolsets || []} />
    </SaveValidationContextProvider>
  );
}
