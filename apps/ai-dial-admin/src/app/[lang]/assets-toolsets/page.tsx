import ToolsetsList from '@/src/components/Assets/Toolsets/List';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <ToolsetFolderProvider>
        <ToolsetsList />
      </ToolsetFolderProvider>
    </SaveValidationContextProvider>
  );
}
