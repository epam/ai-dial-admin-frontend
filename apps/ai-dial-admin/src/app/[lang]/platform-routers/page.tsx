import RoutersList from '@/src/components/Assets/Platform/Routers/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <RoutersList />
    </SaveValidationContextProvider>
  );
}
