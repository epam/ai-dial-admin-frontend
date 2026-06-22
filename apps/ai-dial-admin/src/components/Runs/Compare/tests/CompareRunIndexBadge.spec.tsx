import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';

describe('CompareRunIndexBadge', () => {
  test('renders primary run index with accent background', () => {
    const { container } = render(<CompareRunIndexBadge runIndex={RUN_COMPARE_PRIMARY_INDEX} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-accent-primary-alpha');
  });

  test('renders secondary run index with success background', () => {
    const { container } = render(<CompareRunIndexBadge runIndex={RUN_COMPARE_SECONDARY_INDEX} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-success');
  });
});
