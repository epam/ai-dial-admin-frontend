import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import WelcomeView from '@/src/components/WelcomeView/WelcomeView';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { getMenuItems } from '@/src/utils/env/get-menu-items';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  return (
    <WelcomeView
      disableMenuItems={getMenuItems(process.env.DISABLE_MENU_ITEMS)}
      docLink={process.env.DIAL_ADMIN_DOCUMENTATION}
      dialLink={process.env.DIAL_LINK}
      dialButtonName={process.env.DIAL_LINK_BUTTON_NAME}
    />
  );
}
