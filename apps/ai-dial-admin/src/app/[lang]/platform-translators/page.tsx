import { cookies, headers } from 'next/headers';

import { readPluginOptions } from '@/src/server/config-entities/read-plugin-options';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import TranslatorsList from '@/src/components/Assets/Platform/Translators/List';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const plugins = await readPluginOptions(token);

  return (
    <SaveValidationContextProvider>
      <TranslatorsList plugins={plugins} />
    </SaveValidationContextProvider>
  );
}
