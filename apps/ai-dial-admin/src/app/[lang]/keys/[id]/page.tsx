import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { keysApi, rolesApi } from '@/src/app/api/api';
import KeyView from '@/src/components/KeysList/KeyView';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialKey } from '@/src/models/dial/key';
import { DialRole } from '@/src/models/dial/role';
import { logger } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { filterNames } from '@/src/utils/entities/filter-names';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let keys: DialKey[] | null = [];
  let key: DialKey | null = null;
  let roles: DialRole[] | null = [];
  try {
    keys = await keysApi.getKeysList(token);
    key = await keysApi.getKey((await params.params).id, token);
    roles = await rolesApi.getRolesList(token);
    if (keys === void 0 || key === void 0 || roles === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting key view data error', e);
  }

  if (key == null) {
    redirect(ApplicationRoute.Keys);
  }

  const names = filterNames(keys);

  return (
    <SaveValidationContextProvider>
      <KeyView names={names} keys={keys?.map((key) => key.key || '') || []} originalKey={key} roles={roles || []} />
    </SaveValidationContextProvider>
  );
}
