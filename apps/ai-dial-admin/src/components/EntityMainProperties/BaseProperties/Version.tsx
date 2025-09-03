import { FC } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TextInputField } from '@/src/components/Common/InputField/InputField';

interface Props {
  version?: string;
  readonly?: boolean;
  optional?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: (version?: string) => void;
}

const VersionControl: FC<Props> = ({ version, error, ...props }) => {
  const t = useI18n() as (t: string) => string;

  return (
    <TextInputField
      elementId="displayVersion"
      fieldTitle={t(EntityFieldsI18nKey.displayVersion)}
      placeholder={t(EntityPlaceholdersI18nKey.Version)}
      value={version}
      errorText={error}
      invalid={!!error}
      {...props}
    />
  );
};

export default VersionControl;
