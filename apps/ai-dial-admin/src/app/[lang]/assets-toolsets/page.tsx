import ToolsetsList from '@/src/components/Assets/Toolsets/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <ToolsetsList />
    </SaveValidationContextProvider>
  );
}
