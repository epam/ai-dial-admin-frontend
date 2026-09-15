import PlatformInterceptorsPageList from '@/src/components/Assets/Platform/Interceptors/PageList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <PlatformInterceptorsPageList />
    </SaveValidationContextProvider>
  );
}
