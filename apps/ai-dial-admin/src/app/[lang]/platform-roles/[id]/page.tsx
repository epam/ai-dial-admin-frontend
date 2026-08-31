import { notFound } from 'next/navigation';

import RoleAssetView from '@/src/components/Assets/Platform/Roles/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRoleResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getRole } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  let etag = DEFAULT_ETAG;
  let role: DialRoleResource | null = null;

  try {
    const path = (await params.params).id;

    role = await getRole(path, etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialRoleResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch role asset data');
  }

  if (role == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <RoleAssetView etag={etag} originalRole={role} />
    </SaveValidationContextProvider>
  );
}
