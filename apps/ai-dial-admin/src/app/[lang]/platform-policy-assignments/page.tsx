import { notFound } from 'next/navigation';

import PlatformPolicyAssignmentsList from '@/src/components/Assets/Platform/PolicyAssignments/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { getIsPoliciesEnabled } from '@/src/utils/env/get-policies-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!getIsPoliciesEnabled()) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PlatformPolicyAssignmentsList />
    </SaveValidationContextProvider>
  );
}
