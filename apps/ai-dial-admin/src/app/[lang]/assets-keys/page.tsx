import KeysList from '@/src/components/Assets/Keys/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <KeysList />
    </SaveValidationContextProvider>
  );
}
