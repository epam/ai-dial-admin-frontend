import { Tag, SelectOption, TooltipPlacement } from '@epam/ai-dial-ui-kit';
import { IconAlphabetLatin, IconBraces, IconBrackets, IconFile, IconNumber, IconToggleLeft } from '@tabler/icons-react';
import { capitalize } from 'lodash';
import { ReactNode } from 'react';

const TYPE_ICON_SIZE = 18;

const normalizeType = (type: string): string => type.toLowerCase();

const NUMERIC_TYPES = new Set(['number', 'integer']);

/** Whether a source column type can bind to a metric field type. */
export const isTypeCompatible = (fieldType: string, columnType: string): boolean => {
  const field = normalizeType(fieldType);
  const column = normalizeType(columnType);
  if (field === column) {
    return true;
  }
  return NUMERIC_TYPES.has(field) && NUMERIC_TYPES.has(column);
};

export const getDataTypeIcon = (type: string): ReactNode => {
  switch (normalizeType(type)) {
    case 'number':
    case 'integer':
      return <IconNumber size={TYPE_ICON_SIZE} aria-hidden />;
    case 'boolean':
      return <IconToggleLeft size={TYPE_ICON_SIZE} aria-hidden />;
    case 'array':
      return <IconBrackets size={TYPE_ICON_SIZE} aria-hidden />;
    case 'object':
      return <IconBraces size={TYPE_ICON_SIZE} aria-hidden />;
    case 'file':
      return <IconFile size={TYPE_ICON_SIZE} aria-hidden />;
    case 'string':
    default:
      return <IconAlphabetLatin size={TYPE_ICON_SIZE} aria-hidden />;
  }
};

export const formatDataTypeLabel = (type: string): string => capitalize(normalizeType(type));

export const toTypedSelectOption = ({
  value,
  label,
  type,
  interactiveTooltip,
}: {
  value: string;
  label: string;
  type: string;
  interactiveTooltip?: SelectOption['interactiveTooltip'];
}): SelectOption => ({
  value,
  label,
  rightControl: <Tag label={formatDataTypeLabel(type)} />,
  ...(interactiveTooltip && { interactiveTooltip: { placement: TooltipPlacement.Left, ...interactiveTooltip } }),
});
