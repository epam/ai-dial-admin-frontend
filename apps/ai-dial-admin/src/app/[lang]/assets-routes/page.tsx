import RoutesList from '@/src/components/Assets/Routes/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <RoutesList />
    </SaveValidationContextProvider>
  );
}
