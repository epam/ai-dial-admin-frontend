import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { removeAddon, updateAddon } from '@/src/app/[lang]/addons/actions';
import { addonsApi, rolesApi } from '@/src/app/api/api';
import EntityView from '@/src/components/EntityView/EntityView';
import { DialAddon } from '@/src/models/dial/addon';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { logger } from '@/src/server/logger';
import Page403 from '@/src/components/Page403/Page403';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let addons: DialAddon[] | null = [];
  let addon: DialAddon | null = null;

  let roles: DialRole[] | null = [];

  try {
    addons = await addonsApi.getAddonsList(token);
    addon = await addonsApi.getAddon(decodeURIComponent((await params.params).id), token);

    roles = await rolesApi.getRolesList(token);
    if (addons === void 0 || addon === void 0 || roles === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting addon view data error', e);
  }

  if (addon == null) {
    redirect(ApplicationRoute.Addons);
  }

  return (
    <EntityView
      view={ApplicationRoute.Addons}
      names={addons?.map((model) => model.displayName || '') || []}
      roles={roles}
      originalEntity={addon}
      removeEntity={removeAddon}
      updateEntity={updateAddon}
    />
  );
}
