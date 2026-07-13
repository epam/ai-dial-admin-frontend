import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import NumericFilterDropdown from '@/src/components/Grid/Filter/NumericFilterDropdown';
import { GridFilterType } from '@/src/types/grid-filter';

describe('NumericFilterDropdown', () => {
  test('applies a numeric filter live with the default operator', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<NumericFilterDropdown title="Runs.RunCompareFilterDelta" filter={null} onChange={onChange} />);

    await user.click(screen.getByTitle('Runs.RunCompareFilterDelta'));
    await user.type(await screen.findByPlaceholderText('Grid.FilterValue'), '5');

    expect(onChange).toHaveBeenLastCalledWith({ operator: GridFilterType.GREATER_THAN, value: 5 });
  });
});
