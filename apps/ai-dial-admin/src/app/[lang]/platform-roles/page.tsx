import PlatformRolesPageList from '@/src/components/Assets/Platform/Roles/PageList';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <PlatformRolesPageList />
    </SaveValidationContextProvider>
  );
}
