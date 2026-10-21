import TranslatorsList from '@/src/components/Assets/Platform/Translators/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <TranslatorsList />
    </SaveValidationContextProvider>
  );
}
