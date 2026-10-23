import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Popup } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';

import ValidityPeriod from '@/src/components/Keys/Modals/ValidityPeriod';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import KeyGenerateField from '../View/Properties/KeyGenerateField';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  entity: DialKey;
  names: string[];
  keys: string[];
  onDuplicate: (entity: DialKey) => void;
}

const DuplicateKey: FC<Props> = ({ onDuplicate, isModalOpen, onClose, entity, names, keys }) => {
  const t = useI18n();

  const { isValid, dispatch } = useSaveValidationContext();

  const [clonedEntity, setEntity] = useState<DialKey>({
    ...entity,
    key: '',
    name: getClonedEntityName(entity.name),
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
    <Popup
      onClose={onClose}
      header={t(getCloneTitle(ApplicationRoute.Keys, t))}
      portalId="DuplicateKey"
      open={isModalOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Duplicate),
        isSubmitDisabled: !isValid || !isValidKey,
        onCancel: onClose,
        onSubmit: () => onDuplicate(clonedEntity),
      })}
    >
      <div className="flex flex-col gap-y-8 px-6 py-4">
        <IdControl entity={clonedEntity} names={names} onChangeEntity={setEntity} />
        <DisplayNameControl
          displayName={clonedEntity.displayName}
          onChange={(displayName?: string) => setEntity({ ...clonedEntity, displayName })}
          required
        />

        <KeyGenerateField keys={keys} selectedKey={clonedEntity} changeKey={onChangeKey} />
        <ValidityPeriod onChange={onChangeExpiresAt} />
      </div>
    </Popup>
  );
};

export default DuplicateKey;
