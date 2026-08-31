import RolesList from '@/src/components/Assets/Platform/Roles/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <RolesList />
    </SaveValidationContextProvider>
  );
}
