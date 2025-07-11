import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { keysApi, rolesApi } from '@/src/app/api/api';
import KeyView from '@/src/components/KeysList/KeyView';
import { DialKey } from '@/src/models/dial/key';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { DialRole } from '@/src/models/dial/role';
import { logger } from '@/src/server/logger';
import Page403 from '@/src/components/Page403/Page403';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let keys: DialKey[] | null = [];
  let key: DialKey | null = null;
  let roles: DialRole[] | null = [];
  try {
    keys = await keysApi.getKeysList(token);
    key = await keysApi.getKey(decodeURIComponent((await params.params).id), token);
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

  return (
    <KeyView
      names={keys?.map((key) => key.name || '') || []}
      keys={keys?.map((key) => key.key || '') || []}
      originalKey={key}
      roles={roles || []}
    />
  );
}
