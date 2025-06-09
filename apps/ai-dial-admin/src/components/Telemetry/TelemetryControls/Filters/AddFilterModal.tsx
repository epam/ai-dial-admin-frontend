import { cloneElement, Dispatch, FC, ReactElement, SetStateAction, useCallback, useState } from 'react';
import Button from '@/src/components/Common/Button/Button';
import { ButtonsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { createPortal } from 'react-dom';
import Popup from '@/src/components/Common/Popup/Popup';
import CreateFilter from '@/src/components/Telemetry/TelemetryControls/Filters/CreateFilter';
import { useI18n } from '@/src/locales/client';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  type: FILTER_TYPE;
  condition: FILTER_OPERATOR;
  value: string;
  setType: Dispatch<SetStateAction<FILTER_TYPE>>;
  setCondition: Dispatch<SetStateAction<FILTER_OPERATOR>>;
  setValue: Dispatch<SetStateAction<string>>;
  onCreate: () => void;
  dropdownData: { projects: DropdownItemsModel[]; entities: DropdownItemsModel[] };
  reset: () => void;
  children: ReactElement;
  route: ApplicationRoute;
}

const AddFilterModal: FC<Props> = ({
  type,
  setType,
  setValue,
  value,
  setCondition,
  condition,
  onCreate,
  dropdownData,
  reset,
  children,
  route,
}) => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const onClose = useCallback(() => {
    setIsOpen(false);
    reset();
  }, [reset, setIsOpen]);

  const addFilter = useCallback(() => {
    onCreate();
    onClose();
    reset();
  }, [onClose, onCreate, reset]);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{cloneElement(children)}</div>
      {isOpen &&
        createPortal(
          <Popup onClose={onClose} heading={t(TelemetryI18nKey.AddFilter)} portalId="AddFilter" state={isOpen}>
            <div className="flex flex-col px-6 py-4 h-full">
              <CreateFilter
                onClose={onClose}
                type={type}
                condition={condition}
                value={value}
                setType={setType}
                setCondition={setCondition}
                setValue={setValue}
                dropdownData={dropdownData}
                route={route}
              />
            </div>
            <div className="flex flex-row items-center gap-2 px-6 py-4">
              <Button
                cssClass="secondary flex-grow justify-center"
                title={t(ButtonsI18nKey.Cancel)}
                onClick={onClose}
              />
              <Button
                cssClass="primary flex-grow justify-center"
                title={t(ButtonsI18nKey.Apply)}
                onClick={addFilter}
                disable={!(type && condition && value)}
              />
            </div>
          </Popup>,
          document.body,
        )}
    </>
  );
};

export default AddFilterModal;
