import RolesList from '@/src/components/Assets/Roles/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <RolesList />
    </SaveValidationContextProvider>
  );
}
