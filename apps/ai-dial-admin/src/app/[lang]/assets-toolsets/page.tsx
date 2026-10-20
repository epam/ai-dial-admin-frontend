import AssetsToolsetsList from '@/src/components/Assets/Entities/Toolsets/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <AssetsToolsetsList />
    </SaveValidationContextProvider>
  );
}
