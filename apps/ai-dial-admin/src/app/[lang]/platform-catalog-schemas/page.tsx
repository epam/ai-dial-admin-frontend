import PlatformCatalogSchemasPageList from '@/src/components/Assets/Platform/CatalogSchemas/PageList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <PlatformCatalogSchemasPageList />
    </SaveValidationContextProvider>
  );
}
