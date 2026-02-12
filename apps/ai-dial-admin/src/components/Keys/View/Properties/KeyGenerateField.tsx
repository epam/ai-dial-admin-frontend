import { DialGhostButton, DialPasswordInputField } from '@epam/ai-dial-ui-kit';
import { IconSparkles } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
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
    <div className={classNames('flex items-end gap-x-3', !isKeyImmutable ? 'w-full' : STANDARD_CONTROL_WIDTH)}>
      <div className={CONTROL_WITH_BUTTON_WIDTH}>
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
        <CopyButton
          buttonLabel={t(ButtonsI18nKey.Copy)}
          value={selectedKey.key}
          valueLabel={t(EntityFieldsI18nKey.keyValue)}
        />
      ) : (
        <DialGhostButton
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
