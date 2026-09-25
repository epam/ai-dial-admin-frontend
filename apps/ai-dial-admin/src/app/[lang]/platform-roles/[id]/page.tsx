import { notFound } from 'next/navigation';

import RoleAssetView from '@/src/components/Assets/Platform/Roles/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRoleResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getConfigFileRole, getRole } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ configFile?: string }>;
}) {
  const isConfigFileMode = (await params.searchParams).configFile === 'true';

  let etag = DEFAULT_ETAG;
  let role: DialRoleResource | null = null;

  try {
    const path = (await params.params).id;

    if (isConfigFileMode) {
      const result = await getConfigFileRole(path);
      role = result.success ? (result.data as unknown as DialRoleResource) : null;
    } else {
      role = await getRole(decodeURIComponent(path), etag).then((res) => {
        etag = res?.etag || DEFAULT_ETAG;
        return res?.response as DialRoleResource | null;
      });
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch role asset data');
  }

  if (role == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <RoleAssetView etag={etag} originalRole={role} isConfigFileSource={isConfigFileMode} />
    </SaveValidationContextProvider>
  );
}
