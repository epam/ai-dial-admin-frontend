import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import KeyAssetView from '@/src/components/Assets/Platform/Keys/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRole } from '@/src/models/dial/role';
import { DialKeyResource } from '@/src/models/dial/resource';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getKey } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let key: DialKeyResource | null = null;

  try {
    // Next already decodes the query param once, which restores the resource name `ResourceInfo.path`
    // carries. Decoding again would corrupt any name containing a percent sign.
    const path = (await params.searchParams).path;

    key = await getKey(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialKeyResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch key asset data');
  }

  // Deliberately outside the resource fetch's try, resolved after: an option-list problem must not
  // prevent the key from loading. Core-direct list matches the `Assets > Roles` surface.
  const roles = await readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, []);

  if (key == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <KeyAssetView etag={etag} originalKey={key} roles={roles} />
    </SaveValidationContextProvider>
  );
}
