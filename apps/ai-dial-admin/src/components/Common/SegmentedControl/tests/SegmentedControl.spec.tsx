import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import SegmentedControl from '@/src/components/Common/SegmentedControl/SegmentedControl';
import { SegmentedControlOption } from '@/src/components/Common/SegmentedControl/models';

type View = 'table' | 'pivot';

const options: SegmentedControlOption<View>[] = [
  { value: 'table', label: 'Table' },
  { value: 'pivot', label: 'Pivot' },
];

describe('SegmentedControl', () => {
  test('marks only the selected option as selected', () => {
    render(<SegmentedControl options={options} value="pivot" onChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: 'Pivot' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Table' })).toHaveAttribute('aria-selected', 'false');
  });

  test('calls onChange with the clicked option value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SegmentedControl options={options} value="table" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Pivot' }));

    expect(onChange).toHaveBeenCalledWith('pivot');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
