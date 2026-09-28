/**
 * Scrolls a pivot/table container so `[data-field-key]` is visible in the padded
 * viewport. Sticky chrome is declared in CSS (`scroll-padding` on the container,
 * `scroll-margin` on the target) rather than detected from class names.
 * Off-screen targets pin just after that padding; in-view targets are left alone.
 */

const parseCssPx = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isFullyVisible = (start: number, end: number, visibleStart: number, visibleEnd: number): boolean =>
  start >= visibleStart - 1 && end <= visibleEnd + 1;

const readScrollPadding = (el: HTMLElement) => {
  const style = getComputedStyle(el);
  return { top: parseCssPx(style.scrollPaddingTop), left: parseCssPx(style.scrollPaddingLeft) };
};

const readScrollMargin = (el: HTMLElement) => {
  const style = getComputedStyle(el);
  return { top: parseCssPx(style.scrollMarginTop), left: parseCssPx(style.scrollMarginLeft) };
};

export const scrollPivotToField = (container: HTMLElement | null, fieldKey: string | null | undefined): void => {
  if (!container || !fieldKey) {
    return;
  }
  const target = container.querySelector<HTMLElement>(`[data-field-key="${CSS.escape(fieldKey)}"]`);
  if (!target) {
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const padding = readScrollPadding(container);
  const margin = readScrollMargin(target);
  const visibleLeft = containerRect.left + padding.left;
  const visibleTop = containerRect.top + padding.top;
  const isFullyVisibleX = isFullyVisible(targetRect.left, targetRect.right, visibleLeft, containerRect.right);
  const isFullyVisibleY = isFullyVisible(targetRect.top, targetRect.bottom, visibleTop, containerRect.bottom);
  const deltaLeft = isFullyVisibleX ? 0 : targetRect.left - visibleLeft - margin.left;
  const deltaTop = isFullyVisibleY ? 0 : targetRect.top - visibleTop - margin.top;
  if (deltaLeft === 0 && deltaTop === 0) {
    return;
  }

  container.scrollTo({
    left: container.scrollLeft + deltaLeft,
    top: container.scrollTop + deltaTop,
    behavior: 'auto',
  });
};
