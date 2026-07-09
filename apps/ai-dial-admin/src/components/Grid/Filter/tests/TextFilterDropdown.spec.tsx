import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import TextFilterDropdown from '@/src/components/Grid/Filter/TextFilterDropdown';
import { GridFilterType } from '@/src/types/grid-filter';

describe('TextFilterDropdown', () => {
  test('applies a text filter live with the default operator', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TextFilterDropdown title="Runs.RunCompareFilterField" filter={null} onChange={onChange} />);

    await user.click(screen.getByTitle('Runs.RunCompareFilterField'));
    await user.type(await screen.findByPlaceholderText('Grid.FilterValue'), 'prompt');

    expect(onChange).toHaveBeenLastCalledWith({ operator: GridFilterType.CONTAINS, value: 'prompt' });
  });

  test('clears the filter via reset', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TextFilterDropdown
        title="Runs.RunCompareFilterField"
        filter={{ operator: GridFilterType.CONTAINS, value: 'prompt' }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByTitle('Runs.RunCompareFilterField'));
    await user.click(await screen.findByRole('button', { name: 'Buttons.Reset' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
