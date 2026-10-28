import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ICellRendererParams } from 'ag-grid-community';

import { EntitySelectType } from '@/src/components/Common/EntitySelectInput/models';

import EntitySelectCellRenderer from '../EntitySelectCellRenderer';

vi.mock('@/src/components/Common/EntitySelectInput/EntitySelectInput', () => ({
  default: ({ value, onChangeValue, disabled }: any) => (
    <input
      aria-label="skill-input"
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onChangeValue(e.target.value)}
    />
  ),
}));

// The renderer reads only the members each case sets; the rest of `ICellRendererParams` is grid-supplied.
const cellParams = {} as ICellRendererParams;
const mockNode = { rowIndex: 2 } as unknown as ICellRendererParams['node'];

describe('EntitySelectCellRenderer', () => {
  test('shows the new skill reference immediately and reports it to the grid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const setValue = vi.fn();
    const row = { data: { skill: 'skills/public/a' } };

    render(
      <EntitySelectCellRenderer
        {...cellParams}
        entityType={EntitySelectType.Skill}
        value="skills/public/a"
        data={row}
        colDef={{ field: 'skill' }}
        node={mockNode}
        onChange={onChange}
        setValue={setValue}
      />,
    );

    const input = screen.getByLabelText('skill-input');
    expect(input).toHaveValue('skills/public/a');

    await user.type(input, 'b');

    expect(input).toHaveValue('skills/public/ab');
    expect(onChange).toHaveBeenLastCalledWith('skills/public/ab', row, 'skill', 2);
    expect(setValue).toHaveBeenLastCalledWith('skills/public/ab');
  });

  test('disables the picker when the cell is read-only', () => {
    render(
      <EntitySelectCellRenderer
        {...cellParams}
        entityType={EntitySelectType.Skill}
        value=""
        data={{}}
        colDef={{ field: 'skill' }}
        node={mockNode}
        isReadonly
      />,
    );

    expect(screen.getByLabelText('skill-input')).toBeDisabled();
  });
});
