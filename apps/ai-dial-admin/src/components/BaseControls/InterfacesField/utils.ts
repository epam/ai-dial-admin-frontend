import { getBaseUrlError } from '@/src/components/BaseControls/BaseUrlControl/utils';
import { BaseUrlInterfaceValue } from '@/src/components/BaseControls/InterfacesField/models';
import { InterfaceMode } from '@/src/models/dial/interfaces';

export const hasInvalidCustomTranslatorUrl = (
  interfaces: Record<string, BaseUrlInterfaceValue> | undefined,
  t: (key: string) => string,
): boolean =>
  Object.values(interfaces ?? {}).some(({ mode, translator }) =>
    mode === InterfaceMode.Translator && typeof translator === 'object' && translator != null
      ? !!getBaseUrlError(translator.baseUrl, t, false)
      : false,
  );
