import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { rolesApi, toolSetsApi } from '@/src/app/api/api';
import ToolsetView from '@/src/components/Toolsets/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRole } from '@/src/models/dial/role';
import { Toolset } from '@/src/models/dial/toolset';
import { errorObjLog } from '@/src/server/logger';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterNames } from '@/src/utils/entities/filter-names';
import { isValueTruthy } from '@/src/utils/types';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string; isUser?: string }>;
}) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let toolSet: Toolset | null = null;
  let toolSets: Toolset[] | null = null;

  let roles: DialRole[] | null = null;
  let oAuthCode = null;
  let isUser = false;

  try {
    toolSet = await toolSetsApi.getToolset((await params.params).id, token, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as Toolset | null;
    });

    toolSets = await toolSetsApi.getToolsetList(token);
    roles = await rolesApi.getRolesList(token);
    const searchParams = await params.searchParams;
    oAuthCode = searchParams.code;
    isUser = isValueTruthy(searchParams.isUser);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch toolSet view data');
  }

  if (toolSet == null) {
    notFound();
  }

  const names = filterNames(toolSets, toolSet?.name);

  return (
    <SaveValidationContextProvider>
      <ToolsetView
        oAuthCode={oAuthCode}
        isUserLevel={isUser}
        names={names}
        originalToolset={toolSet}
        roles={roles}
        etag={etag}
      />
    </SaveValidationContextProvider>
  );
}
