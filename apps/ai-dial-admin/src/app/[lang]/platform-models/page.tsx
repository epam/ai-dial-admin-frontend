import PlatformModelsPageList from '@/src/components/Assets/Platform/Models/PageList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <PlatformModelsPageList />
    </SaveValidationContextProvider>
  );
}
