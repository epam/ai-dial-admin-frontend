import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { toolSetsApi } from '@/src/app/api/api';
import ToolsetsList from '@/src/components/Toolsets/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Toolset } from '@/src/models/dial/toolset';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let data: Toolset[] | null = null;

  try {
    data = await toolSetsApi.getToolsetList(token);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch toolsets view data');
  }

  if (data == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <ToolsetsList data={data || []} />
    </SaveValidationContextProvider>
  );
}
