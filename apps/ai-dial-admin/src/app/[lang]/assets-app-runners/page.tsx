import AppRunnersList from '@/src/components/Assets/AppRunners/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <AppRunnersList />
    </SaveValidationContextProvider>
  );
}
