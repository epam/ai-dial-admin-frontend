import { FC, useCallback, useState } from 'react';

import { ButtonVariant, DialButton, DialPasswordInputField } from '@epam/ai-dial-ui-kit';
import { IconCopy, IconSparkles } from '@tabler/icons-react';
import { v4 as uuidv4 } from 'uuid';

import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { FieldError } from '@/src/models/error';
import { getErrorForKey } from './utils';

interface Props {
  isKeyImmutable?: boolean;
  keys: string[];
  selectedKey: DialKey;
  changeKey: (key: DialKey) => void;
}

const KeyGenerateField: FC<Props> = ({ isKeyImmutable, keys, selectedKey, changeKey }) => {
  const t = useI18n();

  const [keyError, setKeyError] = useState<FieldError | null>(null);

  const onChangeKeyValue = useCallback(
    (key?: string) => {
      setKeyError(getErrorForKey(key || '', keys, t));
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
        <DialPasswordInputField
          elementId="key"
          fieldTitle={t(EntityFieldsI18nKey.keyValue)}
          placeholder={t(EntityPlaceholdersI18nKey.KeyValue)}
          value={selectedKey.key}
          errorText={keyError?.text}
          invalid={!!keyError}
          onChange={onChangeKeyValue}
          elementClassName="w-full"
        />
      </div>
      {isKeyImmutable ? (
        <DialButton
          variant={ButtonVariant.Secondary}
          className="ml-2 h-[34px]"
          iconBefore={<IconCopy {...BASE_ICON_PROPS} />}
          label={t(ButtonsI18nKey.Copy)}
          onClick={() => navigator.clipboard.writeText(selectedKey.key || '')}
        />
      ) : (
        <DialButton
          variant={ButtonVariant.Tertiary}
          className="ml-2 h-[34px]"
          iconBefore={<IconSparkles />}
          label={t(ButtonsI18nKey.Generate)}
          onClick={onGenerateKey}
        />
      )}
    </div>
  );
};

export default KeyGenerateField;
