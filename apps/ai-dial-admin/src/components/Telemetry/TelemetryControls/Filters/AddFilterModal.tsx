import { DialFormPopup, SelectOption } from '@epam/ai-dial-ui-kit';
import { createPortal } from 'react-dom';
import { cloneElement, Dispatch, FC, ReactElement, SetStateAction, useCallback, useState } from 'react';

import CreateFilter from '@/src/components/Telemetry/TelemetryControls/Filters/CreateFilter';
import { ButtonsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';

interface Props {
  type: FILTER_TYPE;
  condition: FILTER_OPERATOR;
  value: string[];
  setType: Dispatch<SetStateAction<FILTER_TYPE>>;
  setCondition: Dispatch<SetStateAction<FILTER_OPERATOR>>;
  setValue: Dispatch<SetStateAction<string[]>>;
  onCreate: () => void;
  dropdownData: { projects: SelectOption[]; entities: SelectOption[] };
  reset: () => void;
  children: ReactElement;
  route: ApplicationRoute;
  isMcpView?: boolean;
  isRouteView?: boolean;
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
  isMcpView = false,
  isRouteView = false,
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
          <DialFormPopup
            onClose={onClose}
            header={t(TelemetryI18nKey.AddFilter)}
            portalId="AddFilter"
            onSubmit={addFilter}
            onCancel={onClose}
            disableSubmitButton={!(type && condition && value.length > 0)}
            submitLabel={t(ButtonsI18nKey.Apply)}
            cancelLabel={t(ButtonsI18nKey.Cancel)}
            open={isOpen}
          >
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
                isMcpView={isMcpView}
                isRouteView={isRouteView}
              />
            </div>
          </DialFormPopup>,
          document.body,
        )}
    </>
  );
};

export default AddFilterModal;
