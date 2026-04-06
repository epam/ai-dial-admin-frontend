import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { publicationsApi } from '@/src/app/api/api';
import PublicationView from '@/src/components/Publications/View/View';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Publication } from '@/src/models/dial/publications';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ path: string; code?: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const searchParams = await params.searchParams;
  const oAuthCode = searchParams.code || null;

  let data: Publication | null = null;

  try {
    data = await publicationsApi.getPublication(token, searchParams.path);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch publication toolset view data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PublicationView
        publication={data as Publication}
        view={ApplicationRoute.ToolsetPublications}
        oAuthCode={oAuthCode}
      />
    </SaveValidationContextProvider>
  );
}
