import { FC, useCallback, useState } from 'react';

import { IconCopy, IconSparkles } from '@tabler/icons-react';
import { v4 as uuidv4 } from 'uuid';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import PasswordInputField from '@/src/components/Common/PasswordInput/PasswordInputField';
import { FieldError } from '@/src/models/error';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { getErrorForKey } from './keys-list';

interface Props {
  isKeyImmutable?: boolean;
  keys: string[];
  selectedKey: DialKey;
  changeKey: (key: DialKey) => void;
}

const KeyGenerateField: FC<Props> = ({ isKeyImmutable, keys, selectedKey, changeKey }) => {
  const t = useI18n() as (t: string) => string;

  const [keyError, setKeyError] = useState<FieldError | null>(null);

  const onChangeKeyValue = useCallback(
    (key: string) => {
      setKeyError(getErrorForKey(key, keys, t));
      changeKey({ ...selectedKey, key });
    },
    [changeKey, keys, selectedKey, t],
  );

  const onGenerateKey = () => {
    changeKey({ ...selectedKey, key: uuidv4() });
  };

  return (
    <div className="flex items-end">
      <div className="flex-1">
        <PasswordInputField
          elementId={'key'}
          fieldTitle={t(EntityFieldsI18nKey.keyValue)}
          placeholder={t(EntityPlaceholdersI18nKey.KeyValue)}
          value={selectedKey.key}
          errorText={keyError?.text}
          invalid={!!keyError}
          onChange={onChangeKeyValue}
        />
      </div>
      {isKeyImmutable ? (
        <DialButton
          variant={ButtonVariant.Secondary}
          cssClass="ml-2 h-[34px]"
          iconBefore={<IconCopy />}
          title={t(ButtonsI18nKey.Copy)}
          onClick={() => navigator.clipboard.writeText(selectedKey.key || '')}
        />
      ) : (
        <DialButton
          variant={ButtonVariant.Tertiary}
          cssClass="ml-2 h-[34px]"
          iconBefore={<IconSparkles />}
          title={t(ButtonsI18nKey.Generate)}
          onClick={onGenerateKey}
        />
      )}
    </div>
  );
};

export default KeyGenerateField;
