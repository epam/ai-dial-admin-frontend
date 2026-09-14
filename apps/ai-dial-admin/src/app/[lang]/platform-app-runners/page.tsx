import PlatformAppRunnersPageList from '@/src/components/Assets/Platform/AppRunners/PageList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <PlatformAppRunnersPageList />
    </SaveValidationContextProvider>
  );
}
