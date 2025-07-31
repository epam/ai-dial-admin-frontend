import { cookies, headers } from 'next/headers';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { redirect } from 'next/navigation';
import { ApplicationRoute } from '@/src/types/routes';
import PublicationView from '@/src/components/PublicationView/PublicationView';
import { approvePublication, declinePublication } from '@/src/app/actions/publications';
import { applicationRunnersApi, publicationsApi } from '@/src/app/api/api';
import { Publication } from '@/src/models/dial/publications';
import { logger } from '@/src/server/logger';
import Page403 from '@/src/components/Page403/Page403';
import { DialApplicationScheme } from '@/src/models/dial/application';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ path: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: Publication | null = null;
  let applicationSchemes: DialApplicationScheme[] | null = null;

  try {
    data = await publicationsApi.getPublication(token, (await params.searchParams).path);
    applicationSchemes = await applicationRunnersApi.getApplicationSchemesList(token);
    if (data === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting application publication view data error', e);
  }

  if (data == null) {
    redirect(ApplicationRoute.ApplicationPublications);
  }

  return (
    <PublicationView
      publication={data as Publication}
      view={ApplicationRoute.ApplicationPublications}
      approvePublication={approvePublication}
      declinePublication={declinePublication}
      applicationSchemes={applicationSchemes}
    />
  );
}
