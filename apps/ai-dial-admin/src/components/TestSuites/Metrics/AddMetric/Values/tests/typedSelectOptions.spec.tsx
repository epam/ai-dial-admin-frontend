import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { formatDataTypeLabel, getDataTypeIcon, isTypeCompatible, toTypedSelectOption } from '../typedSelectOptions';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialTag: ({ label }: { label: string }) => <span data-testid="type-tag">{label}</span>,
}));

describe('typedSelectOptions', () => {
  test('formatDataTypeLabel capitalizes lowercase type names', () => {
    expect(formatDataTypeLabel('STRING')).toBe('String');
    expect(formatDataTypeLabel('number')).toBe('Number');
  });

  test('getDataTypeIcon returns a node for known and unknown types', () => {
    expect(getDataTypeIcon('string')).toBeTruthy();
    expect(getDataTypeIcon('FILE')).toBeTruthy();
    expect(getDataTypeIcon('unknown')).toBeTruthy();
  });

  test('isTypeCompatible matches exact and numeric cross types', () => {
    expect(isTypeCompatible('string', 'STRING')).toBe(true);
    expect(isTypeCompatible('number', 'integer')).toBe(true);
    expect(isTypeCompatible('string', 'NUMBER')).toBe(false);
  });

  test('toTypedSelectOption includes type DialTag and optional tooltip', () => {
    const option = toTypedSelectOption({
      value: 'col1',
      label: 'Column 1',
      type: 'STRING',
      interactiveTooltip: { content: <span>preview</span> },
    });

    expect(option.value).toBe('col1');
    expect(option.label).toBe('Column 1');
    expect(option.icon).toBeUndefined();
    expect(option.interactiveTooltip).toBeTruthy();

    render(<>{option.rightControl}</>);
    expect(screen.getByTestId('type-tag')).toHaveTextContent('String');
  });
});
