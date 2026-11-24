import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import TableView from '@/src/components/Applications/ParametersTab/TableView';

describe('TableView — real grid', () => {
  test('updates the correct property after sorting rows by key', async () => {
    const user = userEvent.setup();
    const onChangeProperties = vi.fn();
    const Harness = () => {
      const [properties, setProperties] = useState<Record<string, unknown>>({ zebra: 'last', alpha: 'first' });
      return (
        <TableView
          applicationProperties={properties}
          schemeProperties={[]}
          onChangeProperties={(next) => {
            onChangeProperties(next);
            setProperties(next);
          }}
          onValidityChange={vi.fn()}
          isAddClicked={false}
          setIsAddClicked={vi.fn()}
        />
      );
    };
    render(<Harness />);
    await screen.findByRole('textbox', { name: 'alpha' });
    await user.click(screen.getByRole('columnheader', { name: 'Key' }));
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.getByRole('columnheader', { name: 'Key' })).toHaveAttribute('aria-sort', 'ascending'),
    );
    const rowFor = (label: string) =>
      screen.getAllByRole('row').find((item) => within(item).queryByRole('textbox', { name: label }));
    expect(Number(rowFor('alpha')?.getAttribute('aria-rowindex'))).toBeLessThan(
      Number(rowFor('zebra')?.getAttribute('aria-rowindex')),
    );
    const input = screen.getByRole('textbox', { name: 'alpha' });
    await user.click(input);
    await user.type(input, '!');
    expect(input).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'zebra' })).toHaveValue('last');
    expect(onChangeProperties).toHaveBeenLastCalledWith({ zebra: 'last', alpha: 'first!' });
  });
});
