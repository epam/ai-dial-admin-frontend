import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { publicationsApi } from '@/src/app/api/api';
import Page403 from '@/src/components/Page403/Page403';
import BasePublicationsList from '@/src/components/PublicationsList/PublicationsList';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { Publication } from '@/src/models/dial/publications';
import { logger } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  let data: Publication[] | undefined = [];

  try {
    data = await publicationsApi.getApplicationPublicationsList(token);

    if (data === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting application publications error', e);
  }

  return <BasePublicationsList data={data || []} route={ApplicationRoute.ApplicationPublications} />;
}
