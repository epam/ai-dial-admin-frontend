import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { MetricBinding } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';
import MetricBindingsDisplay from '../MetricBindingsDisplay';

describe('MetricBindingsDisplay', () => {
  test('returns null when bindings are undefined', () => {
    const { container } = render(<MetricBindingsDisplay title="Configuration" />);

    expect(container.firstChild).toBeNull();
  });

  test('returns null when bindings are empty', () => {
    const { container } = render(<MetricBindingsDisplay title="Configuration" bindings={[]} />);

    expect(container.firstChild).toBeNull();
  });

  test('renders title and bindings values', () => {
    const bindings: MetricBinding[] = [
      { property: 'threshold', source: { $type: MetricBindingType.Constant, value: '0.7' } },
      { property: 'maxTokens', source: { $type: MetricBindingType.Constant, value: 100 as unknown as string } },
    ];

    render(<MetricBindingsDisplay title="Configuration" bindings={bindings} />);

    expect(screen.getByText('Configuration:')).toBeInTheDocument();
    expect(screen.getByText(/threshold\s*:\s*0\.7/)).toBeInTheDocument();
    expect(screen.getByText(/maxTokens\s*:\s*100/)).toBeInTheDocument();
  });

  test('renders fallback dash when binding value is empty', () => {
    const bindings: MetricBinding[] = [
      { property: 'temperature', source: { $type: MetricBindingType.Constant, value: '' } },
    ];

    render(<MetricBindingsDisplay title="Configuration" bindings={bindings} />);

    expect(screen.getByText(/temperature\s*:\s*-/)).toBeInTheDocument();
  });
});
