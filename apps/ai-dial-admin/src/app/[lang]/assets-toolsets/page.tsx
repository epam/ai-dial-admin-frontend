import AssetsToolsetsPageList from '@/src/components/Assets/Toolsets/PageList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <AssetsToolsetsPageList />
    </SaveValidationContextProvider>
  );
}
