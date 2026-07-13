import { FC } from 'react';

import classNames from 'classnames';

import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { QueryBuilderColor } from '@/src/models/analytics/query-builder';

interface Props {
  label: string;
  onClick?: () => void;
  ariaLabel?: string;
  colorClassName?: string;
  disabled?: boolean;
}

const DEFAULT_ACTION_COLOR = QUERY_BUILDER_PALETTE[QueryBuilderColor.Measure].text;

// The compact tinted action button used in section headers ("+ Add", "+ Condition", "+ Group").
const SectionAction: FC<Props> = ({ label, onClick, ariaLabel, colorClassName = DEFAULT_ACTION_COLOR, disabled }) => (
  <button
    type="button"
    aria-label={ariaLabel}
    disabled={disabled}
    className={classNames(
      'rounded border border-primary px-2 py-1 dial-tiny-text hover:bg-layer-4 disabled:opacity-50',
      colorClassName,
    )}
    onClick={onClick}
  >
    {label}
  </button>
);

export default SectionAction;
