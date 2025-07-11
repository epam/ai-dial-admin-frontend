import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { adaptersApi } from '@/src/app/api/api';
import { DialAdapter } from '@/src/models/dial/adapter';
import { logger } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import AdapterView from '@/src/components/AdaptersView/AdapterView';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let adapter: DialAdapter | null = null;

  try {
    adapter = await adaptersApi.getAdapter(decodeURIComponent((await params.params).id), token);
  } catch (e) {
    logger.error('Getting adapter view data error', e);
  }

  if (adapter == null) {
    redirect(ApplicationRoute.Adapters);
  }

  return <AdapterView originalAdapter={adapter} />;
}
