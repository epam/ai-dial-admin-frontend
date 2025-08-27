import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { toolSetsApi } from '@/src/app/api/api';
import EntityView from '@/src/components/EntityView/View/EntityView';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialToolset } from '@/src/models/dial/toolset';
import { logger } from '@/src/server/logger';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { removeToolset, updateToolset } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let toolSet: DialToolset | null = null;
  let toolSets: DialToolset[] | null = null;
  try {
    toolSet = await toolSetsApi.getToolset((await params.params).id, token);
    toolSets = await toolSetsApi.getToolsetList(token);

    if (toolSet === void 0 || toolSets === void 0) {
      return <Page403 />;
    }
  } catch (e) {
    logger.error('Getting toolSet view data error', e);
  }

  if (toolSet == null) {
    redirect(ApplicationRoute.Toolsets);
  }

  return (
    <SaveValidationContextProvider>
      <EntityView
        view={ApplicationRoute.Toolsets}
        names={toolSets?.map((t) => t.name || '') || []}
        originalEntity={toolSet}
        removeEntity={removeToolset}
        updateEntity={updateToolset}
      />
    </SaveValidationContextProvider>
  );
}
