import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { keysApi, rolesApi } from '@/src/app/api/api';
import KeyView from '@/src/components/Keys/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialKey } from '@/src/models/dial/key';
import { DialRole } from '@/src/models/dial/role';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterNames } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let keys: DialKey[] | null = [];
  let key: DialKey | null = null;
  let roles: DialRole[] | null = [];
  try {
    keys = await keysApi.getKeysList(token);
    key = await keysApi.getKey((await params.params).id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialKey | null;
    });
    roles = await rolesApi.getRolesList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch key data');
  }

  if (key == null) {
    notFound();
  }

  const names = filterNames(keys, key?.name);

  return (
    <SaveValidationContextProvider>
      <KeyView
        etag={etag}
        names={names}
        keys={keys?.map((key) => key.key || '') || []}
        originalKey={key}
        roles={roles || []}
      />
    </SaveValidationContextProvider>
  );
}
