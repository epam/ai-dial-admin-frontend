import type { Placement } from '@floating-ui/react';
import {
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { FC, ReactNode, createContext, useContext, useMemo, useRef, useState } from 'react';

const ARROW_HEIGHT = 7;
const GAP = 2;

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = createContext<ContextType>(null);

export interface TooltipContainerOptions {
  initialOpen?: boolean;
  placement?: Placement;
  isTriggerClickable?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const useTooltipContext = () => {
  const context = useContext(TooltipContext);

  if (context == null) {
    throw new Error('Tooltip components must be wrapped in <Tooltip />');
  }

  return context;
};

export const useTooltip = ({
  initialOpen = false,
  placement = 'bottom',
  isTriggerClickable = false,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: TooltipContainerOptions = {}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(initialOpen);
  const arrowRef = useRef<SVGSVGElement>(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(ARROW_HEIGHT + GAP),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: 'start',
        padding: 5,
      }),
      shift({ padding: 5 }),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  const hover = useHover(data.context, {
    move: false,
    enabled: controlledOpen == null,
    mouseOnly: isTriggerClickable,
    delay: { open: 500, close: 0 },
  });
  const focus = useFocus(data.context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(data.context);
  const role = useRole(data.context, { role: 'tooltip' });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  return useMemo(
    () => ({
      open,
      setOpen,
      arrowRef,
      ...interactions,
      ...data,
    }),
    [open, setOpen, interactions, data],
  );
};

interface Props {
  children: ReactNode;
}
const TooltipContainer: FC<Props & TooltipContainerOptions> = ({ children, ...options }) => {
  // or other positioning options.
  const tooltip = useTooltip(options);

  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
};

export default TooltipContainer;
