import ProjectsList from '@/src/components/Assets/Artifacts/Projects/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <ProjectsList />
    </SaveValidationContextProvider>
  );
}
