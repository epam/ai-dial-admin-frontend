import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';

import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import PluginView from '@/src/components/PluginView/PluginView';
import { EmbeddedApp } from '@/src/context/AppContext';
import Page404 from '@/src/components/Page404/Page404';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ slug: string[] }> }) {
  const pageParams = await params.params;
  const slug = pageParams.slug[0];
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
  const embeddedApps: string[] = JSON.parse(process.env.EMBEDDED_APPS || '[]').map((app: EmbeddedApp) => app.slug);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  if (embeddedApps.includes(`/${slug}`)) {
    return <PluginView slug={slug} />;
  }

  return <Page404 />;
}
