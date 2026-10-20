import PromptsList from '@/src/components/Assets/Artifacts/Prompts/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <PromptsList />
    </SaveValidationContextProvider>
  );
}
