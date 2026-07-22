import { FC } from 'react';

import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props {
  endpoint?: string | null;
  disabled?: boolean;
  isFullWidth?: boolean;
  onChange?: (endpoint?: string) => void;
}

const VendorWebsiteControl: FC<Props> = ({ endpoint, onChange, isFullWidth = false, disabled }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <DialInput
      id="vendorWebsite"
      labelProps={{ label: t(EntityFieldsI18nKey.vendorWebsite) }}
      placeholder={t(EntityPlaceholdersI18nKey.VendorWebsite)}
      value={endpoint || ''}
      onChange={onChange}
      containerClassName={isFullWidth ? 'w-full' : STANDARD_CONTROL_WIDTH}
      disabled={disabled || isReadOnlyAdmin}
    />
  );
};

export default VendorWebsiteControl;
