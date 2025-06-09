import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, FormHTMLAttributes, MouseEvent, ReactNode, useCallback } from 'react';

import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import { PopUpState } from '@/src/types/pop-up';

interface Props extends FormHTMLAttributes<HTMLFormElement> {
  heading?: string | ReactNode;
  portalId: string;
  headingClassName?: string;
  overlayClassName?: string;
  containerClassName?: string;
  state?: PopUpState | boolean;
  children: ReactNode[];
  dividers?: boolean;
  onClose: () => void;
  dataTestId?: string;
}

const PopupView: FC<Props> = ({
  portalId,
  state = PopUpState.Opened,
  heading,
  headingClassName,
  onClose,
  children,
  overlayClassName,
  containerClassName,
  dividers = true,
  dataTestId,
}) => {
  const { refs, context } = useFloating({
    open: state !== PopUpState.Closed && !!state,
    onOpenChange: onClose,
  });

  const role = useRole(context, { role: 'dialog' });
  const dismiss = useDismiss(context, { outsidePress: true });
  const { getFloatingProps } = useInteractions([role, dismiss]);

  const handleClose = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      onClose();
    },
    [onClose],
  );

  return (
    <FloatingPortal id={portalId}>
      {state !== PopUpState.Closed && (
        <FloatingOverlay
          className={classNames('z-[52] flex items-center justify-center bg-blackout p-4', overlayClassName)}
        >
          <FloatingFocusManager context={context}>
            <div
              className={classNames(
                'relative max-h-full rounded bg-layer-3 flex flex-col shadow w-full lg:max-w-[35%] md:max-w-[40%]',
                dividers && 'divide-tertiary divide-y',
                containerClassName,
              )}
              ref={refs.setFloating}
              {...getFloatingProps()}
              data-testid={dataTestId}
            >
              {
                <div className="flex flex-row justify-between py-4 px-6 items-center mb-2">
                  {heading &&
                    (typeof heading === 'string' ? (
                      <h3 className={classNames('flex-1 min-w-0 mr-3', headingClassName)}>
                        <Tooltip contentClassName="truncate" tooltip={heading}>
                          {heading}
                        </Tooltip>
                      </h3>
                    ) : (
                      heading
                    ))}
                  <button
                    type="button"
                    aria-label="button"
                    data-testid="modalClose"
                    className="text-secondary hover:text-accent-primary"
                    onClick={handleClose}
                  >
                    <IconX height={24} width={24} />
                  </button>
                </div>
              }
              {children[0]}
              {children[1]}
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      )}
    </FloatingPortal>
  );
};

const Popup: FC<Props> = (props: Props) => {
  if (props.state === PopUpState.Closed) {
    return null;
  }

  return <PopupView {...props} />;
};

export default Popup;
