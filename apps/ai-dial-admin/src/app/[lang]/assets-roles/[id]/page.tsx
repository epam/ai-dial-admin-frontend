import { notFound } from 'next/navigation';

import RoleAssetView from '@/src/components/Assets/Roles/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialRoleResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getRole } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ path: string }>;
}) {
  let etag = DEFAULT_ETAG;
  let role: DialRoleResource | null = null;

  try {
    // Next already decodes the query param once, which restores the resource name `ResourceInfo.path`
    // carries. Decoding again would corrupt any name containing a percent sign.
    const path = (await params.searchParams).path;

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
