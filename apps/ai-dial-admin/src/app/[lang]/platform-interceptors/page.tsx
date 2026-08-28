import InterceptorsList from '@/src/components/Assets/Platform/Interceptors/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <InterceptorsList />
    </SaveValidationContextProvider>
  );
}
