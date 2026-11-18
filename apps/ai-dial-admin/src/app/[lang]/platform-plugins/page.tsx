import PluginsList from '@/src/components/Assets/Platform/Plugins/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <PluginsList />
    </SaveValidationContextProvider>
  );
}
