'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { MenuItemMark, Select, SelectProps } from '@epam/ai-dial-ui-kit';

interface Props extends SelectProps {
  /**
   * Marks the field as required on its label. The 2.0 `Select` carries that inside `labelProps`, which
   * every caller would otherwise have to remember to nest — and half of them would pass a bare `label`
   * instead, as the 1.0 field took.
   */
  required?: boolean;
}

/**
 * The project's select field, on the 2.0 `Select`.
 *
 * It exists because the 1.0 `DialSelectField` has no 2.0 counterpart: 2.0 ships the control, and the
 * label/caption/error composition the old field did is now the control's own `labelProps`. Wrapping it
 * once keeps that shape in one place rather than in every call site, and gives the migration of the
 * rest of the console a single seam to move through.
 */
/**
 * Roomier rows than the kit's default, and rows that keep their height.
 *
 * The option height follows the field's `size`, and raising that would make the field taller than the
 * inputs beside it — so the padding is added to the list alone. `shrink-0` is the other half: the list
 * is a bounded flex column, so once the options outgrow it they were squeezed rather than scrolled, and
 * a select over a long table list drew visibly tighter rows than one over four.
 */
const ROOMY_OPTIONS = '[&_[role="option"]]:py-2 [&_[role="option"]]:shrink-0';

const SelectField: FC<Props> = ({ required, labelProps, listClassName, ...selectProps }) => (
  <Select
    // A trailing check rather than the list's default tint: the tint is a background token this
    // deployment's theme does not define, so the chosen row came out indistinguishable from the rest.
    selectedOptionMark={MenuItemMark.Check}
    {...selectProps}
    listClassName={classNames(ROOMY_OPTIONS, listClassName)}
    labelProps={labelProps && { ...labelProps, required: required ?? labelProps.required }}
  />
);

export default SelectField;
