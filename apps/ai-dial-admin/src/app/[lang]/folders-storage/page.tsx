import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import FoldersStorage from '@/src/components/FoldersStorage/FoldersStorage';
import { SIGN_IN_LINK } from '@/src/constants/auth';
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

  return <FoldersStorage />;
}
