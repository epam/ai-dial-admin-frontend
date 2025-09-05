import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { rolesApi, toolSetsApi } from '@/src/app/api/api';
import Page403 from '@/src/components/Page403/Page403';
import ToolsetView from '@/src/components/Toolsets/View/View';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialToolset, Tools } from '@/src/models/dial/toolset';
import { logger } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { DialRole } from '@/src/models/dial/role';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let toolSet: DialToolset | null = null;
  let toolSets: DialToolset[] | null = null;
  let tools: Tools[] | null = null;
  let roles: DialRole[] | null = null;

  try {
    toolSet = await toolSetsApi.getToolset((await params.params).id, token);
    tools = await toolSetsApi.getTools((await params.params).id, token);

    toolSets = await toolSetsApi.getToolsetList(token);
    roles = await rolesApi.getRolesList(token);
    if (toolSet === void 0 || toolSets === void 0 || roles === void 0 || tools === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting toolSet view data error', e);
  }

  if (toolSet == null) {
    redirect(ApplicationRoute.Toolsets);
  }

  const names = toolSets?.reduce((acc, curr) => {
    if (curr.name != null) {
      acc.push(curr.name);
    }
    return acc;
  }, [] as string[]) as string[];

  return (
    <SaveValidationContextProvider>
      <ToolsetView names={names} originalToolset={toolSet} roles={roles} />
    </SaveValidationContextProvider>
  );
}
