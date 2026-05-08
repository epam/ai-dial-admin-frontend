import React, { cloneElement, Dispatch, FC, ReactElement, SetStateAction, useCallback, useState } from 'react';
import CreateFilter from '@/src/components/Telemetry/TelemetryControls/Filters/CreateFilter';
import {
  autoUpdate,
  FloatingFocusManager,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import { SelectOption } from '@epam/ai-dial-ui-kit';

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

const AddFilterPopover: FC<Props> = ({
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
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [shift()],
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const role = useRole(context, { role: 'tooltip' });
  const dismiss = useDismiss(context, {
    outsidePress: () => {
      if (type && condition && value.length > 0) {
        onCreate();
        onClose();
      }

      return true;
    },
  });

  const onClose = useCallback(() => {
    setIsOpen(false);
    reset();
  }, [setIsOpen, reset]);

  const { getFloatingProps, getReferenceProps } = useInteractions([click, dismiss, role]);
  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {cloneElement(children)}
      </div>
      {isOpen && (
        <div aria-expanded={isOpen}>
          <FloatingFocusManager context={context}>
            <div
              ref={refs.setFloating}
              style={{
                ...floatingStyles,
                zIndex: 50,
              }}
              {...getFloatingProps()}
            >
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
          </FloatingFocusManager>
        </div>
      )}
    </>
  );
};

export default AddFilterPopover;
