import { cookies, headers } from 'next/headers';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { redirect } from 'next/navigation';
import { ApplicationRoute } from '@/src/types/routes';
import PublicationView from '@/src/components/Publications/View/View';
import { approvePublication, declinePublication } from '@/src/app/actions/publications';
import { publicationsApi } from '@/src/app/api/api';
import { Publication } from '@/src/models/dial/publications';
import { errorObjLog } from '@/src/server/logger';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ path: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: Publication | null = null;

  try {
    data = await publicationsApi.getPublication(token, (await params.searchParams).path);
    if (data === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch publication toolset view data');
  }

  if (data == null) {
    redirect(ApplicationRoute.ToolsetPublications);
  }

  return (
    <SaveValidationContextProvider>
      <PublicationView
        publication={data as Publication}
        view={ApplicationRoute.ToolsetPublications}
        approvePublication={approvePublication}
        declinePublication={declinePublication}
      />
    </SaveValidationContextProvider>
  );
}
