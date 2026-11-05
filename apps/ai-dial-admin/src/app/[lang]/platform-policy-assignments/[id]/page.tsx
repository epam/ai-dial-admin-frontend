import { notFound } from 'next/navigation';

import PolicyAssignmentAssetView from '@/src/components/Assets/Platform/PolicyAssignments/View';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import { errorObjLog } from '@/src/server/logger';
import { getIsPoliciesEnabled } from '@/src/utils/env/get-policies-toggle';
import { getPolicyAssignment } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  if (!getIsPoliciesEnabled()) {
    notFound();
  }

  let etag = DEFAULT_ETAG;
  let assignment: DialPolicyAssignmentResource | null = null;

  try {
    const { id } = await params.params;
    assignment = await getPolicyAssignment(decodeURIComponent(id), etag).then((res) => {
      etag = res?.etag || DEFAULT_ETAG;
      return res?.response as DialPolicyAssignmentResource | null;
    });
  } catch (e) {
    errorObjLog(e, 'Failed to fetch policy assignment data');
  }

  if (assignment == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PolicyAssignmentAssetView etag={etag} originalAssignment={assignment} />
    </SaveValidationContextProvider>
  );
}
