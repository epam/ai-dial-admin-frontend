import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';

import { getConfigFileToolset } from '@/src/app/[lang]/toolsets/actions';
import { rolesApi, toolSetsApi } from '@/src/app/api/api';
import ToolsetView from '@/src/components/Toolsets/View/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRole } from '@/src/models/dial/role';
import { Toolset } from '@/src/models/dial/toolset';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { errorObjLog } from '@/src/server/logger';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { filterNames } from '@/src/utils/entities/filter-names';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string; configFile?: string }>;
}) {
  const searchParams = await params.searchParams;
  const isConfigFileMode = searchParams.configFile === 'true';

  if (!process.env.DIAL_ADMIN_API_URL && !isConfigFileMode) {
    redirect(ApplicationRoute.Home);
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  let etag = DEFAULT_ETAG;
  let toolSet: Toolset | null = null;
  let toolSets: Toolset[] | null = null;

  let roles: DialRole[] | null = null;
  let oAuthCode = null;

  try {
    const id = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileToolset(id);
      toolSet = result.success ? (result.data as Toolset) : null;
      toolSets = toolSet ? [toolSet] : [];
      roles = await readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, [], true);
    } else {
      toolSet = await toolSetsApi.getToolset(id, token, etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as Toolset | null;
      });

      toolSets = await toolSetsApi.getToolsetList(token);
      roles = await rolesApi.getRolesList(token);
      oAuthCode = searchParams.code;
    }
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
        names={names}
        originalToolset={toolSet}
        roles={roles}
        etag={etag}
        isConfigFileSource={isConfigFileMode}
      />
    </SaveValidationContextProvider>
  );
}
