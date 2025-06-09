import { useMergeRefs } from '@floating-ui/react';
import { HTMLProps, Ref, cloneElement, forwardRef, isValidElement } from 'react';
import { useTooltipContext } from './TooltipContext';

const TooltipTrigger = forwardRef<HTMLElement, HTMLProps<HTMLElement> & { asChild?: boolean }>(function TooltipTrigger(
  { children, asChild = false, ...props },
  propRef,
) {
  const context = useTooltipContext();

  const isRefInChildren = children && typeof children === 'object' && 'ref' in children && children.ref !== undefined;

  const childrenRef = isRefInChildren ? (children.ref as Ref<unknown>) : undefined;

  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && isValidElement(children)) {
    return cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...(children.props as HTMLProps<Element>),
      }),
    );
  }

  return (
    <span ref={ref} {...context.getReferenceProps(props)} className={props.className || 'text-left'}>
      {children}
    </span>
  );
});
export default TooltipTrigger;
