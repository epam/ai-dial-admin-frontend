import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import FoldersStorage from '@/src/components/FoldersStorage/FoldersStorage';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getFolders } from './actions';
import { ROOT_FOLDER } from '@/src/constants/file';
import Page403 from '@/src/components/Page403/Page403';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ path: string }> }) {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);
  const initialPath = (await params.searchParams).path;

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  const folders = await getFolders(`${ROOT_FOLDER}/`);
  if (folders === void 0) {
    return <Page403 />;
  }

  return <FoldersStorage initialPath={initialPath && decodeURIComponent(initialPath)} />;
}
