/**
 * Horizontally scrolls a pivot container so the column with `data-field-key` is visible.
 */
export const scrollPivotToField = (container: HTMLElement | null, fieldKey: string | null | undefined): void => {
  if (!container || !fieldKey) {
    return;
  }
  const target = container.querySelector<HTMLElement>(`[data-field-key="${CSS.escape(fieldKey)}"]`);
  target?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
};
