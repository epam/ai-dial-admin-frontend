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
  readonly?: boolean;
  valueCssClasses?: string;
  inputCssClasses?: string;
}

const InputModal: FC<Props> = ({
  children,
  modalState,
  readonly,
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
              readonly ? 'border-0 p-0 body' : '',
            )}
          >
            <span className={valueCssClasses}>{value}</span>
            {!readonly && <OpenPopup />}
          </div>
        </button>
      ) : (
        <div className="w-full" onClick={onOpenModal}>
          <div
            className={classNames(
              'input flex flex-row items-center w-full justify-between truncate',
              readonly ? 'border-0 p-0' : '',
            )}
          >
            <AutocompleteInputValue readonly={readonly} selectedItems={value as string[]} />
            {!readonly && (
              <div className="ml-1">
                <OpenPopup />
              </div>
            )}
          </div>
        </div>
      )}
      {modalState === PopUpState.Opened && createPortal(children, document.body)}
    </>
  );
};

export default InputModal;
