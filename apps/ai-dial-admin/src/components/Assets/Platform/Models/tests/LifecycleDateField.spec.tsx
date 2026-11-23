import { appContextMock } from '@/test-mocks/app-context';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import LifecycleDateField from '../LifecycleDateField';

const LABEL = 'Deprecation date';

const renderField = (value?: string) => {
  const onChange = vi.fn();
  render(<LifecycleDateField id="deprecationDate" label={LABEL} value={value} onChange={onChange} />);
  return onChange;
};

const clearButton = () => screen.queryByRole('button', { name: `${ButtonsI18nKey.Clear} ${LABEL}` });

describe('LifecycleDateField', () => {
  test('Should show the stored date in the field', () => {
    renderField('2027-12-31');

    expect(screen.getByText(/31 Dec 2027/)).toBeInTheDocument();
  });

  test('Should show the placeholder for an absent value', () => {
    renderField();

    expect(screen.getByText('EntityPlaceholders.SelectDate')).toBeInTheDocument();
  });

  test('Should show the placeholder for a malformed value, without rewriting it', () => {
    const onChange = renderField('soon');

    expect(screen.getByText('EntityPlaceholders.SelectDate')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('Should store a picked day as a plain YYYY-MM-DD string', async () => {
    const onChange = renderField('2027-06-01');

    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${LABEL}`) }));
    await userEvent.click(await screen.findByRole('button', { name: /30 June 2027/ }));

    expect(onChange).toHaveBeenCalledWith('2027-06-30');
  });

  test('Should offer a clear button only while a value is set', () => {
    renderField('2027-06-30');

    expect(clearButton()).toBeInTheDocument();
  });

  test('Should offer no clear button for an empty field', () => {
    renderField();

    expect(clearButton()).not.toBeInTheDocument();
  });

  test('Should remove the date when cleared', async () => {
    const onChange = renderField('2027-06-30');

    await userEvent.click(clearButton() as HTMLElement);

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  test('Should disable the field and the clear button for a read-only admin', () => {
    appContextMock.set({ isReadOnlyAdmin: true });
    renderField('2027-06-30');

    expect(clearButton()).toBeDisabled();
  });
});
