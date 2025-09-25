import { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import AutocompleteInputValue from '@/src/components/Common/AutocompleteInput/AutocompleteInputValue';
import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  modalState: PopUpState;
  selectedValue?: string | string[];
  children: ReactNode;
  onOpenModal: () => void;
  readonly?: boolean;
  valueCssClasses?: string;
  inputCssClasses?: string;
  elementId?: string;
  errorText?: string;
}

const InputModal: FC<Props> = ({
  children,
  modalState,
  readonly,
  selectedValue,
  valueCssClasses,
  inputCssClasses,
  onOpenModal,
  elementId,
  errorText,
}) => {
  const t = useI18n();

  const value = selectedValue != null && selectedValue?.length ? selectedValue : t(BasicI18nKey.None);

  return (
    <>
      {typeof value === 'string' || selectedValue?.length === 0 ? (
        <>
          <button
            type="button"
            className="w-full"
            onClick={readonly ? void 0 : onOpenModal}
            aria-label="open-popup"
            id={elementId}
          >
            <div
              className={classNames(
                readonly ? 'input-disable' : '',
                'input input-field flex flex-row items-center w-full justify-between',
                inputCssClasses,
                errorText ? 'input-error' : '',
              )}
            >
              <Tooltip tooltip={value}>
                <span className={valueCssClasses}>{value}</span>
              </Tooltip>
              {!readonly && (
                <div className="flex-shrink-0">
                  <OpenPopup />
                </div>
              )}
            </div>
          </button>
          {errorText && <ErrorText errorText={errorText} />}
        </>
      ) : (
        <div className="w-full" onClick={readonly ? void 0 : onOpenModal}>
          <div
            className={classNames(
              'input flex flex-row items-center w-full justify-between',
              readonly ? 'input-disable' : '',
            )}
          >
            <AutocompleteInputValue selectedItems={value as string[]} />
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
