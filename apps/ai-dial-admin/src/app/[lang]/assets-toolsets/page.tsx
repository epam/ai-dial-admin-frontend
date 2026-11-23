import AssetsToolsetsList from '@/src/components/Assets/Entities/Toolsets/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { isValueTruthy } from '@/src/utils/types';

export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <SaveValidationContextProvider>
      <AssetsToolsetsList isUnsafeImportEnabled={isValueTruthy(process.env.ENABLE_UNSAFE_TOOLSET_IMPORT)} />
    </SaveValidationContextProvider>
  );
}
