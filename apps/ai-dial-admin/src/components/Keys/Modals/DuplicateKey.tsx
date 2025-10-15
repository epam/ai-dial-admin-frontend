import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ButtonVariant, DialButton, DialPopup } from '@epam/ai-dial-ui-kit';

import ValidityPeriod from '@/src/components/Keys/Modals/ValidityPeriod';
import { ButtonsI18nKey, DuplicateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import KeyGenerateField from '../View/Properties/KeyGenerateField';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  entity: DialKey;
  names: string[];
  keys: string[];
  onDuplicate: (entity: DialKey) => void;
}

const DuplicateKey: FC<Props> = ({ onDuplicate, isModalOpen, onClose, entity, names, keys }) => {
  const t = useI18n() as (t: string) => string;

  const { isValid, dispatch } = useSaveValidationContext();

  const [clonedEntity, setEntity] = useState<DialKey>({
    ...entity,
    key: '',
    name: '',
    expiresAt: void 0,
  });

  const isValidKey = useMemo(() => {
    return !keys.includes(clonedEntity.key || '');
  }, [clonedEntity.key, keys]);

  const onChangeExpiresAt = useCallback(
    (expiresAt: string) => {
      setEntity({ ...clonedEntity, expiresAt });
    },
    [clonedEntity],
  );

  const onChangeKey = useCallback(
    (key: DialKey) => {
      setEntity(key);
    },
    [setEntity],
  );

  // initial validation (disable save when no values entered yet)
  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'key', isValid: !!clonedEntity.key });
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!clonedEntity.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clonedEntity]);

  return (
    <DialPopup
      onClose={onClose}
      title={t(DuplicateI18nKey.Key)}
      portalId="DuplicateKey"
      open={isModalOpen}
      footer={
        <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
          <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

          <DialButton
            variant={ButtonVariant.Primary}
            title={t(ButtonsI18nKey.Duplicate)}
            disable={!isValid || !isValidKey}
            onClick={() => onDuplicate(clonedEntity)}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-6 px-6 py-4">
        <IdControl entity={clonedEntity} names={names} onChangeEntity={setEntity} />
        <DisplayNameControl
          displayName={clonedEntity.displayName}
          onChange={(displayName?: string) => setEntity({ ...clonedEntity, displayName })}
        />

        <KeyGenerateField keys={keys} selectedKey={clonedEntity} changeKey={onChangeKey} />
        <ValidityPeriod onChange={onChangeExpiresAt} />
      </div>
    </DialPopup>
  );
};

export default DuplicateKey;
