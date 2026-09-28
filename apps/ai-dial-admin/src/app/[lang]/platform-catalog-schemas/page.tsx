import CatalogSchemasList from '@/src/components/Assets/Platform/CatalogSchemas/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <CatalogSchemasList />
    </SaveValidationContextProvider>
  );
}
