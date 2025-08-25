import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialModel } from '@/src/models/dial/model';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { duplicateModalDescriptionMap, duplicateModalTitleMap } from './constants';

type ClonedEntity = DialBaseNamedEntity | DialModel;
interface Props {
  view: ApplicationRoute;
  modalState: PopUpState;
  names: string[];
  entity?: ClonedEntity;
  onClose: () => void;
  onDuplicate: (entity: ClonedEntity) => void;
}

const DuplicatePopup: FC<Props> = ({ onDuplicate, names, view, modalState, onClose, entity }) => {
  const t = useI18n() as (t: string) => string;
  const isSimple = isSimpleEntity(view);

  const [clonedEntity, setEntity] = useState<ClonedEntity>(
    isSimple ? { ...entity, name: '' } : { ...entity, name: '', displayVersion: '', displayName: '' },
  );

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

  const onChangeDisplayName = useCallback(
    (displayName: string) => {
      setEntity({ ...clonedEntity, displayName });
    },
    [setEntity, clonedEntity],
  );

  return (
    <Popup onClose={onClose} heading={t(heading)} portalId="DeleteEntity" state={modalState}>
      <div className="flex flex-col px-6 py-4">
        {!!duplicateModalDescriptionMap[view] && (
          <div className="text-secondary small mb-4">{t(duplicateModalDescriptionMap[view])}</div>
        )}
        <div className="flex flex-col gap-3">
          <IdControl entity={clonedEntity} onChangeEntity={setEntity} names={names} />
          <DisplayNameControl displayName={clonedEntity.displayName} onChange={onChangeDisplayName} />

          {view === ApplicationRoute.Models && (
            <VersionControl version={(clonedEntity as DialModel).displayVersion} onChange={onChangeVersion} />
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
export default DuplicatePopup;
