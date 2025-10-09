import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { rolesApi, toolSetsApi } from '@/src/app/api/api';
import Page403 from '@/src/components/Page403/Page403';
import ToolsetView from '@/src/components/Toolsets/View/View';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { Toolset } from '@/src/models/dial/toolset';
import { logError } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { DialRole } from '@/src/models/dial/role';
import { filterNames } from '@/src/utils/entities/filter-names';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let toolSet: Toolset | null = null;
  let toolSets: Toolset[] | null = null;

  let roles: DialRole[] | null = null;

  try {
    toolSet = await toolSetsApi.getToolset((await params.params).id, token);

    toolSets = await toolSetsApi.getToolsetList(token);
    roles = await rolesApi.getRolesList(token);
    if (toolSet === void 0 || toolSets === void 0 || roles === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logError(e, 'Failed to fetch toolSet view data');
  }

  if (toolSet == null) {
    redirect(ApplicationRoute.Toolsets);
  }

  const names = filterNames(toolSets, toolSet?.name);

  return (
    <SaveValidationContextProvider>
      <ToolsetView names={names} originalToolset={toolSet} roles={roles} />
    </SaveValidationContextProvider>
  );
}
