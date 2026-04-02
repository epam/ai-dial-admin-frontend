import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import MetricCard from '../MetricCard';
import MetricCardsGrid from '../MetricCardsGrid';

describe('MetricCard', () => {
  test('Should render metric name, formatted value and progress bar', () => {
    const { container } = render(<MetricCard name="f1" value={0.118} isError={false} />);

    expect(screen.getByText('f1')).toBeInTheDocument();
    expect(screen.getByText('0.118')).toBeInTheDocument();
    const fill = container.querySelector('[style*="width"]');
    expect(fill).toBeTruthy();
  });

  test('Should render dash for null value', () => {
    render(<MetricCard name="score" value={null} isError={true} />);

    expect(screen.getByText('\u2014')).toBeInTheDocument();
  });

  test('Should apply error styling when isError is true', () => {
    const { container } = render(<MetricCard name="score" value={null} isError={true} />);

    expect(container.firstChild).toHaveClass('border-error');
  });

  test('Should call onClick when provided', () => {
    const onClick = vi.fn();
    render(<MetricCard name="f1" value={0.5} isError={false} onClick={onClick} />);

    fireEvent.click(screen.getByText('f1'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('MetricCardsGrid', () => {
  test('Should render cards for all metrics in a group', () => {
    const group = {
      title: 'retrieval',
      metrics: [
        { key: 'f1', value: 0.118, isError: false },
        { key: 'mrr', value: 1, isError: false },
      ],
      hasError: false,
    };
    render(<MetricCardsGrid group={group} />);

    expect(screen.getByText('f1')).toBeInTheDocument();
    expect(screen.getByText('mrr')).toBeInTheDocument();
  });

  test('Should not make cards clickable when no infos', () => {
    const group = {
      title: 'group',
      metrics: [{ key: 'score', value: 0.5, isError: false }],
      hasError: false,
    };
    render(<MetricCardsGrid group={group} />);

    const card = screen.getByText('score').closest('div');
    expect(card).not.toHaveAttribute('role', 'button');
  });
});
