'use client';

import classNames from 'classnames';
import { FC } from 'react';

interface Props {
  label: string;
  isPressed: boolean;
  onToggle: () => void;
}

// The kit's selectable tag draws nothing until it is selected, and its outlined one does not carry the
// pressed state, so a visible two-state chip is its own element.
const FilterToggle: FC<Props> = ({ label, isPressed, onToggle }) => (
  <button
    type="button"
    aria-pressed={isPressed}
    className={classNames(
      'rounded-full px-4 py-1.5 dial-small-text transition-colors',
      isPressed
        ? 'bg-controls-accent-primary-alpha-active text-primary dial-small-semi-text'
        : 'bg-accent-primary-alpha text-secondary hover:bg-controls-accent-primary-alpha-active',
    )}
    onClick={onToggle}
  >
    {label}
  </button>
);

export default FilterToggle;
