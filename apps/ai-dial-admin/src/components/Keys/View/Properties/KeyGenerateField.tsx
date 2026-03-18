import { DialGhostButton, DialPasswordInput } from '@epam/ai-dial-ui-kit';
import { IconSparkles } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { FieldError } from '@/src/models/error';
import { getErrorForKey } from './utils';

interface Props {
  isKeyImmutable?: boolean;
  keys: string[];
  selectedKey: DialKey;
  changeKey: (key: DialKey) => void;
  disabled?: boolean;
}

const KeyGenerateField: FC<Props> = ({ isKeyImmutable, keys, selectedKey, changeKey, disabled }) => {
  const t = useI18n();

  const [keyError, setKeyError] = useState<FieldError | null>(null);
  const isMobile = useIsMobileScreen();

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
    <div className="flex">
      <div className={classNames('flex items-end gap-x-3', !isKeyImmutable && 'w-full')}>
        <div className={CONTROL_WITH_BUTTON_WIDTH}>
          <DialPasswordInput
            id="key"
            labelProps={{ label: t(EntityFieldsI18nKey.keyValue), required: true }}
            placeholder={t(EntityPlaceholdersI18nKey.KeyValue)}
            value={selectedKey.key}
            error={keyError?.text}
            invalid={!!keyError}
            onChange={onChangeKeyValue}
            disabled={disabled}
          />
        </div>
        {!disabled &&
          (isKeyImmutable ? (
            <CopyButton
              buttonLabel={isMobile ? '' : t(ButtonsI18nKey.Copy)}
              value={selectedKey.key}
              valueLabel={t(EntityFieldsI18nKey.keyValue)}
            />
          ) : (
            <DialGhostButton
              className="ml-2"
              iconBefore={<IconSparkles />}
              label={t(ButtonsI18nKey.Generate)}
              onClick={onGenerateKey}
            />
          ))}
      </div>
    </div>
  );
};

export default KeyGenerateField;
