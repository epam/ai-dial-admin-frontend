import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity, DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { duplicateModalDescriptionMap, duplicateModalTitleMap } from './titles';

interface Props {
  view: ApplicationRoute;
  modalState: PopUpState;
  onClose: () => void;
  entity?: DialBaseEntity | DialBaseNamedEntity;
  onDuplicate: (entity: DialBaseEntity | DialBaseNamedEntity) => void;
}

const DuplicateEntityPopup: FC<Props> = ({ onDuplicate, view, modalState, onClose, entity }) => {
  const t = useI18n() as (t: string) => string;
  const isSimple = isSimpleEntity(view);

  const [clonedEntity, setEntity] = useState<DialBaseEntity | DialBaseNamedEntity>(
    isSimple ? { ...entity, name: '' } : { ...entity, name: '', displayVersion: '', displayName: '' },
  );
  const [isValid, setIsValid] = useState(false);
  const heading = duplicateModalTitleMap[view as string];

  useEffect(() => {
    setIsValid(!!clonedEntity.name);
  }, [clonedEntity, isSimple]);

  const onChangeVersion = useCallback(
    (displayVersion: string) => {
      setEntity({ ...(clonedEntity as DialBaseEntity), displayVersion });
    },
    [setEntity, clonedEntity],
  );

  const onChangeName = useCallback(
    (name: string) => {
      setEntity({ ...clonedEntity, name });
    },
    [setEntity, clonedEntity],
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
        {isSimple ? (
          <div className="flex flex-col gap-3">
            <TextInputField
              fieldTitle={t(CreateI18nKey.NameTitle)}
              elementId="name"
              placeholder={t(CreateI18nKey.NamePlaceholder)}
              value={clonedEntity.name}
              onChange={onChangeName}
            />
          </div>
        ) : (
          <>
            <div className="text-secondary small mb-4">{t(duplicateModalDescriptionMap[view])}</div>
            <div className="flex flex-col gap-3">
              <TextInputField
                fieldTitle={t(CreateI18nKey.DeploymentIdTitle)}
                elementId="deploymentId"
                placeholder={t(CreateI18nKey.DeploymentIdPlaceholder)}
                value={clonedEntity.name}
                onChange={onChangeName}
              />

              <TextInputField
                fieldTitle={t(CreateI18nKey.DisplayNameTitle)}
                elementId="name"
                placeholder={t(CreateI18nKey.DisplayNamePlaceholder)}
                value={(clonedEntity as DialBaseEntity).displayName}
                onChange={onChangeDisplayName}
              />

              <TextInputField
                fieldTitle={t(CreateI18nKey.VersionTitle)}
                elementId="version"
                placeholder={t(CreateI18nKey.VersionPlaceholder)}
                value={(clonedEntity as DialBaseEntity).displayVersion}
                onChange={onChangeVersion}
              />
            </div>
          </>
        )}
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
