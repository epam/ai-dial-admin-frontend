import SkillsList from '@/src/components/Assets/Skills/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <SkillsList />
    </SaveValidationContextProvider>
  );
}
