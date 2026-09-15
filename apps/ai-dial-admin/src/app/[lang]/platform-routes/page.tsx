import PlatformRoutesPageList from '@/src/components/Assets/Platform/Routes/PageList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <PlatformRoutesPageList />
    </SaveValidationContextProvider>
  );
}
