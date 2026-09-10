import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import { rolesApi } from '@/src/app/api/api';
import RolesList from '@/src/components/Roles/List/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRole } from '@/src/models/dial/role';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!process.env.DIAL_ADMIN_API_URL) {
    redirect(ApplicationRoute.Home);
  }
  let data: DialRole[] | null = null;

  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  try {
    data = await rolesApi.getRolesList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch roles view data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <RolesList data={data || []} />
    </SaveValidationContextProvider>
  );
}
