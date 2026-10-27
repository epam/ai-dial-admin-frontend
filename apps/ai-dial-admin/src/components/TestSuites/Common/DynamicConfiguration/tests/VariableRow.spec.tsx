import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { InputBindingRowData } from '@/src/models/evaluation/test-suite';
import { InputBindingType, TestCaseItemType } from '@/src/types/evaluation';
import VariableRow from '../VariableRow';

vi.mock('@/src/components/Common/FileSelectInput/FileSelectInput', () => ({
  default: ({ value, onChangeValue }: any) => (
    <input aria-label="file-input" value={value} onChange={(e) => onChangeValue(e.target.value)} />
  ),
}));

vi.mock('@/src/components/Common/SkillSelectInput/SkillSelectInput', () => ({
  default: ({ value, onChangeValue, disabled }: any) => (
    <input aria-label="skill-input" disabled={disabled} value={value} onChange={(e) => onChangeValue(e.target.value)} />
  ),
}));

const createRow = (effectiveType: TestCaseItemType, value?: unknown): InputBindingRowData => ({
  templateVariable: 'var1',
  effectiveType,
  type: InputBindingType.Constant,
  value,
});

describe('VariableRow — reference types', () => {
  test('renders the file picker for a FILE variable and not the skill picker', () => {
    render(<VariableRow row={createRow(TestCaseItemType.FILE, 'public/a.txt')} onChangeValue={vi.fn()} />);

    expect(screen.getByLabelText('file-input')).toHaveValue('public/a.txt');
    expect(screen.queryByLabelText('skill-input')).toBeNull();
  });

  test('renders the skill picker for a SKILL variable and not the file picker', () => {
    render(<VariableRow row={createRow(TestCaseItemType.SKILL, 'skills/public/s')} onChangeValue={vi.fn()} />);

    expect(screen.getByLabelText('skill-input')).toHaveValue('skills/public/s');
    expect(screen.queryByLabelText('file-input')).toBeNull();
  });

  test('reports the typed skill reference with its row', async () => {
    const user = userEvent.setup();
    const onChangeValue = vi.fn();
    const row = createRow(TestCaseItemType.SKILL, 'skills/public/s');
    render(<VariableRow row={row} onChangeValue={onChangeValue} />);

    await user.type(screen.getByLabelText('skill-input'), '2');

    expect(onChangeValue).toHaveBeenCalledWith(row, 'skills/public/s2');
  });

  test('disables the skill picker when read-only', () => {
    render(<VariableRow row={createRow(TestCaseItemType.SKILL)} readonly onChangeValue={vi.fn()} />);

    expect(screen.getByLabelText('skill-input')).toBeDisabled();
  });
});
