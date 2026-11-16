import AliasesList from '@/src/components/Assets/Entities/Aliases/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <AliasesList />
    </SaveValidationContextProvider>
  );
}
