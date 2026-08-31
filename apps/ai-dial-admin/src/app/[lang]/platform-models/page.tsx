import ModelsList from '@/src/components/Assets/Platform/Models/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <ModelsList />
    </SaveValidationContextProvider>
  );
}
