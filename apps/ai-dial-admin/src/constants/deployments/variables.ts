import { SelectOption } from '@epam/ai-dial-ui-kit';
import { MOUNT_TYPE } from '@/src/types/deployments/variables';
import { EnvVariablesI18nKey } from '@/src/constants/i18n';

export const mountTypeDropdownItems = (t: (key: string) => string): SelectOption[] => {
  return [
    { value: MOUNT_TYPE.CONTENT, label: t(EnvVariablesI18nKey.MountTypeContent) },
    { value: MOUNT_TYPE.SECURE_CONTENT, label: t(EnvVariablesI18nKey.MountTypeSecureContent) },
    { value: MOUNT_TYPE.SECURE_FILE, label: t(EnvVariablesI18nKey.MountTypeSecureFile) },
  ];
};
