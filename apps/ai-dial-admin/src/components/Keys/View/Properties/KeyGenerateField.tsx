import { DialGhostButton, DialNeutralButton, DialPasswordInputField } from '@epam/ai-dial-ui-kit';
import { IconCopy, IconSparkles } from '@tabler/icons-react';
import { FC, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import classNames from 'classnames';

import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { FieldError } from '@/src/models/error';
import { getErrorForKey } from './utils';
import CopyButton from '../../../Common/CopyButton/CopyButton';

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
    <div className={classNames('flex items-end', !isKeyImmutable ? 'w-full' : STANDARD_CONTROL_WIDTH)}>
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
        <CopyButton className="ml-2" label={t(ButtonsI18nKey.Copy)} field={selectedKey.key} isFullButton={true} />
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
