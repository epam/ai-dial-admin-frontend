import { notFound } from 'next/navigation';

import PolicyAssetView from '@/src/components/Assets/Platform/Policies/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialPolicyResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getIsPoliciesEnabled } from '@/src/utils/env/get-policies-toggle';
import { getPolicy } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  if (!getIsPoliciesEnabled()) {
    notFound();
  }

  let etag = DEFAULT_ETAG;
  let policy: DialPolicyResource | null = null;

  try {
    const { id } = await params.params;
    policy = await getPolicy(decodeURIComponent(id), etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialPolicyResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch policy data');
  }

  if (policy == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PolicyAssetView etag={etag} originalPolicy={policy} />
    </SaveValidationContextProvider>
  );
}
