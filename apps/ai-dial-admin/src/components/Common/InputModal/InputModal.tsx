import { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import AutocompleteInputValue from '@/src/components/Common/AutocompleteInput/AutocompleteInputValue';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import classNames from 'classnames';

interface Props {
  modalState: PopUpState;
  selectedValue?: string | string[];
  children: ReactNode;
  onOpenModal: () => void;
  valueCssClasses?: string;
  inputCssClasses?: string;
}

const InputModal: FC<Props> = ({
  children,
  modalState,
  selectedValue,
  valueCssClasses,
  inputCssClasses,
  onOpenModal,
}) => {
  const t = useI18n();

  const value = selectedValue != null && selectedValue?.length ? selectedValue : t(BasicI18nKey.None);

  return (
    <>
      {typeof value === 'string' || selectedValue?.length === 0 ? (
        <button type="button" className="w-full" onClick={onOpenModal} aria-label="open-popup">
          <div
            className={classNames(
              'input input-field flex flex-row items-center w-full justify-between',
              inputCssClasses,
            )}
          >
            <span className={valueCssClasses}>{value}</span>
            <OpenPopup />
          </div>
        </button>
      ) : (
        <div className="w-full" onClick={onOpenModal}>
          <div className="input flex flex-row items-center w-full justify-between truncate">
            <AutocompleteInputValue selectedItems={value as string[]} />
            <div className="ml-1">
              <OpenPopup />
            </div>
          </div>
        </div>
      )}
      {modalState === PopUpState.Opened && createPortal(children, document.body)}
    </>
  );
};

export default InputModal;
