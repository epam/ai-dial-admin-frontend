import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import NewItemInput from '@/src/components/Common/Multiselect/Modal/NewItemInput';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { GetItemError } from '@/src/models/error';
import { getAnalyticsEnumValueError } from '@/src/utils/validation/analytics-table-error';

const renderInput = (value: string, getItemError?: GetItemError) =>
  render(
    <NewItemInput value={value} index={0} getItemError={getItemError} onChangeItem={vi.fn()} onRemoveItem={vi.fn()} />,
  );

const type = (text: string) => fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });

describe('NewItemInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('applies the topic rule by default: a single character is refused', () => {
    renderInput('');
    type('a');

    expect(screen.getByText(ErrorI18nKey.MinMaxLength)).toBeInTheDocument();
  });

  test('applies the check it is given instead: a single character is accepted, 65 are refused', () => {
    renderInput('', getAnalyticsEnumValueError);

    type('a');
    expect(screen.queryByText(ErrorI18nKey.MinMaxLength)).not.toBeInTheDocument();
    expect(screen.queryByText(ErrorI18nKey.Length)).not.toBeInTheDocument();

    type('a'.repeat(65));
    expect(screen.getByText(ErrorI18nKey.Length)).toBeInTheDocument();
  });

  test("shows the check's message for a value it is seeded with", () => {
    renderInput('a'.repeat(65), getAnalyticsEnumValueError);

    expect(screen.getByText(ErrorI18nKey.Length)).toBeInTheDocument();
  });
});
