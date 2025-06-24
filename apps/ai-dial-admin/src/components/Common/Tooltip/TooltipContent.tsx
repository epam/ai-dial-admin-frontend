import { FloatingArrow, FloatingPortal, useMergeRefs } from '@floating-ui/react';
import { HTMLProps, forwardRef } from 'react';

import classNames from 'classnames';
import { useTooltipContext } from './TooltipContext';

const TooltipContent = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>(function TooltipContent(
  { style, ...props },
  propRef,
) {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);

  if (!context.open) {
    return null;
  }

  return (
    <FloatingPortal id="theme-main">
      <div
        ref={ref}
        style={{
          ...context.floatingStyles,
          ...style,
        }}
        {...context.getFloatingProps(props)}
        className={classNames(
          'z-[55] whitespace-pre-wrap rounded border border-primary bg-blackout px-2 py-1 tiny shadow max-w-[300px]',
          context.getFloatingProps(props).className as string,
        )}
      >
        {props.children}
        <FloatingArrow
          ref={context.arrowRef}
          context={context.context}
          fill="currentColor"
          strokeWidth={1}
          className="stroke-primary w-2 text-[var(--bg-layer-0,_#000000)]"
        />
      </div>
    </FloatingPortal>
  );
});

export default TooltipContent;
