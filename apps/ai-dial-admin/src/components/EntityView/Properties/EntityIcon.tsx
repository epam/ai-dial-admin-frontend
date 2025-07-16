'use client';

import { FC, useCallback, useState } from 'react';
import Field from '@/src/components/Common/Field/Field';
import FilledIcon from '@/src/components/Common/IconFile/FilledIcon';
import IconGalleryModal from '@/src/components/IconGallery/IconGalleryModal';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import { PopUpState } from '@/src/types/pop-up';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { useAppContext } from '@/src/context/AppContext';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  fieldTitle: string;
  entity: DialBaseEntity;
  elementId: string;
  readonly?: boolean;
  onChangeEntity?: (entity: DialBaseEntity) => void;
}

const EntityIcon: FC<Props> = ({ fieldTitle, elementId, entity, readonly, onChangeEntity }) => {
  const t = useI18n();
  const { themeUrl } = useAppContext();
  const value = entity.iconUrl
    ? entity.iconUrl.startsWith('https://')
      ? entity.iconUrl
      : `${themeUrl}/${entity.iconUrl}`
    : '';
  const [modalState, setIsModalState] = useState(PopUpState.Closed);

  const onChangeIcon = useCallback(
    (url: string) => {
      onChangeEntity?.({ ...entity, iconUrl: url });
    },
    [entity, onChangeEntity],
  );

  const onCloseModal = useCallback(() => {
    setIsModalState(PopUpState.Closed);
  }, [setIsModalState]);

  const onOpenModal = useCallback(() => {
    setIsModalState(PopUpState.Opened);
  }, [setIsModalState]);

  return (
    <div className="flex flex-col md:max-w-[180px]">
      <Field fieldTitle={fieldTitle} htmlFor={elementId} />
      {value.length === 0 ? (
        readonly ? (
          t(BasicI18nKey.None)
        ) : (
          <InputModal modalState={modalState} selectedValue={value} onOpenModal={onOpenModal}>
            <IconGalleryModal
              modalState={modalState}
              selectedValue={value}
              onClose={onCloseModal}
              onChange={onChangeIcon}
            />
          </InputModal>
        )
      ) : (
        <FilledIcon fileUrl={value} onChange={onChangeIcon} readonly={readonly} />
      )}
    </div>
  );
};

export default EntityIcon;
