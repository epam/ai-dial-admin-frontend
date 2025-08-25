import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TextInputField } from '../../Common/InputField/InputField';
import { FC } from 'react';

interface Props {
  version?: string;
  readonly?: boolean;
  disabled?: boolean;
  onChange?: (version: string) => void;
}

const VersionControl: FC<Props> = ({ version, ...props }) => {
  const t = useI18n() as (t: string) => string;

  return (
    <TextInputField
      elementId="displayVersion"
      fieldTitle={t(EntityFieldsI18nKey.displayVersion)}
      value={version}
      {...props}
    />
  );
};

export default VersionControl;
