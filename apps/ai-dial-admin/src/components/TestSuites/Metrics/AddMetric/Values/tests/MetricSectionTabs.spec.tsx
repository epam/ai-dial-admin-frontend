import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { SectionView } from '@/src/components/TestSuites/Metrics/AddMetric/constants';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import MetricSectionTabs from '../MetricSectionTabs';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  ElementSize: { Small: 'small' },
  Select: ({ options, value, onChange, prefix }: any) => (
    <select aria-label="section-view" value={value} data-prefix={prefix} onChange={(e) => onChange(e.target.value)}>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  Badge: ({ label }: any) => <span data-testid="schema-readonly-badge">{label}</span>,
  Tooltip: ({ children }: any) => <>{children}</>,
}));

vi.mock('../SchemaViewer', () => ({
  default: () => <div data-testid="schema-viewer" />,
}));

describe('MetricSectionTabs', () => {
  test('hides Read only badge on Controls view and shows it on Schema view', () => {
    render(<MetricSectionTabs title="Inputs" schema={{ type: 'object' }} controlsContent={<div>controls</div>} />);

    expect(screen.queryByTestId('schema-readonly-badge')).not.toBeInTheDocument();
    expect(screen.getByText('controls')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'section-view' }), {
      target: { value: SectionView.Schema },
    });

    expect(screen.getByTestId('schema-readonly-badge')).toHaveTextContent(TestSuitesI18nKey.SchemaReadOnlyBadge);
    expect(screen.getByTestId('schema-viewer')).toBeInTheDocument();
    expect(screen.queryByText('controls')).not.toBeInTheDocument();
  });
});
