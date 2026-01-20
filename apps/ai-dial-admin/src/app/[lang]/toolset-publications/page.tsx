import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { publicationsApi } from '@/src/app/api/api';
import PublicationsList from '@/src/components/Publications/List/List';
import { Publication } from '@/src/models/dial/publications';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: Publication[] | undefined = undefined;

  try {
    data = await publicationsApi.getToolsetPublicationsList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch toolset publications data');
  }

  if (data == null) {
    notFound();
  }

  return <PublicationsList data={data || []} route={ApplicationRoute.ToolsetPublications} />;
}
