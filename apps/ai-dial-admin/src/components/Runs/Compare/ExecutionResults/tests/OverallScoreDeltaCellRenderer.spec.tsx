import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import OverallScoreDeltaCellRenderer from '@/src/components/Runs/Compare/ExecutionResults/OverallScoreDeltaCellRenderer';

describe('OverallScoreDeltaCellRenderer', () => {
  test('renders the signed difference between compared overall scores', () => {
    render(<OverallScoreDeltaCellRenderer {...({ data: { primaryScore: 0.75, comparedScore: 1 } } as any)} />);

    expect(screen.getByText('+0.250')).toBeInTheDocument();
  });

  test('renders no badge when overall scores are equal', () => {
    const { container } = render(
      <OverallScoreDeltaCellRenderer {...({ data: { primaryScore: 0.75, comparedScore: 0.75 } } as any)} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
