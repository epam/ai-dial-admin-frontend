import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity, DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { FieldError } from '@/src/models/error';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { duplicateModalDescriptionMap, duplicateModalTitleMap } from './titles';
import { DialModel } from '@/src/models/dial/model';

type ClonedEntity = DialBaseEntity | DialBaseNamedEntity | DialModel;
interface Props {
  view: ApplicationRoute;
  modalState: PopUpState;
  names: string[];
  entity?: ClonedEntity;
  onClose: () => void;
  onDuplicate: (entity: ClonedEntity) => void;
}

const DuplicateEntityPopup: FC<Props> = ({ onDuplicate, names, view, modalState, onClose, entity }) => {
  const t = useI18n() as (t: string) => string;
  const isSimple = isSimpleEntity(view);

  const [clonedEntity, setEntity] = useState<ClonedEntity>(
    isSimple ? { ...entity, name: '' } : { ...entity, name: '', displayVersion: '', displayName: '' },
  );
  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [isValid, setIsValid] = useState(false);
  const heading = duplicateModalTitleMap[view as string];

  useEffect(() => {
    setIsValid(!!clonedEntity.name);
  }, [clonedEntity, isSimple]);

  const onChangeVersion = useCallback(
    (displayVersion: string) => {
      setEntity({ ...(clonedEntity as DialModel), displayVersion });
    },
    [setEntity, clonedEntity],
  );

  const onChangeName = useCallback(
    (name: string) => {
      setEntity({ ...clonedEntity, name });
      setNameError(getErrorForName(name, names, t));
    },
    [clonedEntity, names, t],
  );

  const onChangeDisplayName = useCallback(
    (displayName: string) => {
      setEntity({ ...(clonedEntity as DialBaseEntity), displayName });
    },
    [setEntity, clonedEntity],
  );

  return (
    <Popup onClose={onClose} heading={t(heading)} portalId="DeleteEntity" state={modalState}>
      <div className="flex flex-col px-6 py-4">
        {!isSimple && <div className="text-secondary small mb-4">{t(duplicateModalDescriptionMap[view])}</div>}
        <div className="flex flex-col gap-3">
          <TextInputField
            elementId="id"
            placeholder={t(EntityPlaceholdersI18nKey.Id)}
            fieldTitle={t(EntityFieldsI18nKey.id)}
            value={clonedEntity.name}
            errorText={nameError?.text}
            invalid={!!nameError}
            onChange={onChangeName}
          />
          {!isSimple && (
            <>
              <TextInputField
                fieldTitle={t(EntityFieldsI18nKey.displayName)}
                placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
                elementId="name"
                value={(clonedEntity as DialBaseEntity).displayName}
                onChange={onChangeDisplayName}
              />

              {view === ApplicationRoute.Models && (
                <TextInputField
                  fieldTitle={t(CreateI18nKey.VersionTitle)}
                  elementId="version"
                  placeholder={t(CreateI18nKey.VersionPlaceholder)}
                  value={(clonedEntity as DialModel).displayVersion}
                  onChange={onChangeVersion}
                />
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button
          dataTestId="cancelBtn"
          cssClass="secondary"
          title={t(ButtonsI18nKey.Cancel)}
          onClick={() => onClose()}
        />

        <Button
          dataTestId="duplicateBtn"
          cssClass="primary"
          title={t(ButtonsI18nKey.Duplicate)}
          disable={!isValid}
          onClick={() => onDuplicate(clonedEntity)}
        />
      </div>
    </Popup>
  );
};
export default DuplicateEntityPopup;
