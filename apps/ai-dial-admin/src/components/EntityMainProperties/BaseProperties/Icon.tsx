'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import Field from '@/src/components/Common/Field/Field';
import FilledIcon from '@/src/components/Common/IconFile/FilledIcon';
import IconGalleryModal from '@/src/components/IconGallery/IconGalleryModal';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import { PopUpState } from '@/src/types/pop-up';
import { useAppContext } from '@/src/context/AppContext';
import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  iconUrl?: string;
  readonly?: boolean;
  onChange?: (iconUrl: string) => void;
}

const IconControl: FC<Props> = ({ iconUrl, readonly, onChange }) => {
  const t = useI18n();
  const { themeUrl } = useAppContext();
  const value = useMemo(
    () => (iconUrl ? (iconUrl.startsWith('https://') ? iconUrl : `${themeUrl}/${iconUrl}`) : ''),
    [iconUrl, themeUrl],
  );
  const [modalState, setIsModalState] = useState(PopUpState.Closed);

  const onCloseModal = useCallback(() => {
    setIsModalState(PopUpState.Closed);
  }, [setIsModalState]);

  const onOpenModal = useCallback(() => {
    setIsModalState(PopUpState.Opened);
  }, [setIsModalState]);

  return (
    <div className="flex flex-col md:max-w-[180px]">
      <Field fieldTitle={t(EntityFieldsI18nKey.iconUrl)} htmlFor="icon" />
      {value.length === 0 ? (
        readonly ? (
          t(BasicI18nKey.None)
        ) : (
          <InputModal modalState={modalState} selectedValue={value} onOpenModal={onOpenModal}>
            <IconGalleryModal
              modalState={modalState}
              selectedValue={value}
              onClose={onCloseModal}
              onChange={(url) => onChange?.(url)}
            />
          </InputModal>
        )
      ) : (
        <FilledIcon fileUrl={value} onChange={(url) => onChange?.(url)} readonly={readonly} />
      )}
    </div>
  );
};

export default IconControl;
