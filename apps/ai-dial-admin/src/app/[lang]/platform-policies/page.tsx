import { notFound } from 'next/navigation';

import PlatformPoliciesList from '@/src/components/Assets/Platform/Policies/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { getIsPoliciesEnabled } from '@/src/utils/env/get-policies-toggle';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (!getIsPoliciesEnabled()) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <PlatformPoliciesList />
    </SaveValidationContextProvider>
  );
}
