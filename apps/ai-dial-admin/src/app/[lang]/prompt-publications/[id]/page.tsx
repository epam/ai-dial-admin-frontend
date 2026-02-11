import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { approvePublication, declinePublication, deletePublication } from '@/src/app/actions/publications';
import { publicationsApi } from '@/src/app/api/api';
import PublicationView from '@/src/components/Publications/View/View';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Publication } from '@/src/models/dial/publications';
import { errorObjLog } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ path: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: Publication | null = null;

  try {
    data = await publicationsApi.getPublication(token, (await params.searchParams).path);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch publication prompt view data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PublicationView
        publication={data as Publication}
        view={ApplicationRoute.PromptPublications}
        approvePublication={approvePublication}
        declinePublication={declinePublication}
        deletePublication={deletePublication}
      />
    </SaveValidationContextProvider>
  );
}
