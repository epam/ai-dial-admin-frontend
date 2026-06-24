import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import MetricSubSection from '@/src/components/Runs/Export/components/MetricSubSection';
import { ColumnItem } from '@/src/components/Runs/Export/models';

const makeItems = (names: string[]): ColumnItem[] =>
  names.map((name) => ({
    name,
    displayName: name.split(':').pop() ?? name,
    defaultChecked: true,
    subGroup: 'Accuracy',
  }));

describe('MetricSubSection', () => {
  it('renders the metric group header label', () => {
    render(
      <MetricSubSection
        metricName="Accuracy"
        items={makeItems(['metric::Accuracy::score'])}
        checkedColumns={new Set()}
        onToggleColumn={vi.fn()}
      />,
    );
    expect(screen.getByText('metric:Accuracy')).toBeInTheDocument();
  });

  it('shows item checkboxes when expanded', () => {
    render(
      <MetricSubSection
        metricName="Accuracy"
        items={makeItems(['metric::Accuracy::score', 'metric::Accuracy::value'])}
        checkedColumns={new Set()}
        onToggleColumn={vi.fn()}
      />,
    );
    expect(screen.getByText('metric::Accuracy::score')).toBeInTheDocument();
    expect(screen.getByText('metric::Accuracy::value')).toBeInTheDocument();
  });

  it('hides items when collapsed', async () => {
    render(
      <MetricSubSection
        metricName="Accuracy"
        items={makeItems(['metric::Accuracy::score'])}
        checkedColumns={new Set()}
        onToggleColumn={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('metric::Accuracy::score')).not.toBeInTheDocument();
  });

  it('calls onToggleColumn when an item checkbox is clicked', async () => {
    const onToggleColumn = vi.fn();
    render(
      <MetricSubSection
        metricName="Accuracy"
        items={makeItems(['metric::Accuracy::score'])}
        checkedColumns={new Set(['metric::Accuracy::score'])}
        onToggleColumn={onToggleColumn}
      />,
    );
    await userEvent.click(screen.getByLabelText('metric::Accuracy::score'));
    expect(onToggleColumn).toHaveBeenCalledWith('metric::Accuracy::score', expect.any(Boolean));
  });

  it('calls onToggleColumn for every item when the group header is toggled', async () => {
    const onToggleColumn = vi.fn();
    const items = makeItems(['metric::Accuracy::score', 'metric::Accuracy::value']);
    render(
      <MetricSubSection
        metricName="Accuracy"
        items={items}
        checkedColumns={new Set()}
        onToggleColumn={onToggleColumn}
      />,
    );
    await userEvent.click(screen.getByLabelText('metric:Accuracy'));
    expect(onToggleColumn).toHaveBeenCalledTimes(2);
  });
});
