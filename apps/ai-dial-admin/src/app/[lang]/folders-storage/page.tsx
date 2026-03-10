import FoldersStorage from '@/src/components/FoldersStorage/FoldersStorage';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ path: string }> }) {
  const initialPath = (await params.searchParams).path;

  return (
    <SaveValidationContextProvider>
      <FoldersStorage initialPath={initialPath && decodeURIComponent(initialPath)} />
    </SaveValidationContextProvider>
  );
}
