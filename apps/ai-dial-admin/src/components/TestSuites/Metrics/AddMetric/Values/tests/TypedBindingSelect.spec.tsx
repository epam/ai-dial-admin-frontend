import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import TypedBindingSelect from '../TypedBindingSelect';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  ErrorText: ({ text }: any) => (text ? <span role="alert">{text}</span> : null),
  Select: ({ invalid, listClassName, error }: any) => (
    <select role="combobox" aria-invalid={invalid} aria-errormessage={error} data-list-class={listClassName} />
  ),
}));

describe('TypedBindingSelect', () => {
  const renderSelect = (props?: Partial<React.ComponentProps<typeof TypedBindingSelect>>) =>
    render(<TypedBindingSelect elementId="field" options={[]} placeholder="Select" onChange={vi.fn()} {...props} />);

  test('renders the error outside the select and marks the select invalid', () => {
    renderSelect({ invalid: true, error: 'Type mismatch' });

    expect(screen.getByRole('alert')).toHaveTextContent('Type mismatch');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-errormessage');
  });

  test('renders no error when the select is valid', () => {
    renderSelect();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('stretches the option row button over the whole row', () => {
    renderSelect();

    expect(screen.getByRole('combobox').getAttribute('data-list-class')).toContain(
      '[&_[data-menu-item-row]]:after:inset-0',
    );
  });
});
