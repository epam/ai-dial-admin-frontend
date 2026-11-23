import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import SessionDetailPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailPanel';

const renderPanel = (props: { hint?: string; source?: string } = {}) =>
  render(
    <SessionDetailPanel icon={null} iconClassName="" title="quality" {...props}>
      <p>body</p>
    </SessionDetailPanel>,
  );

describe('SessionDetailPanel', () => {
  test('makes a hinted title keyboard-focusable so its tooltip reaches a keyboard', () => {
    renderPanel({ hint: 'Quality labels written by the evaluator.' });

    expect(screen.getByText('quality')).toHaveAttribute('tabindex', '0');
  });

  test('renders a plain title without a hint', () => {
    renderPanel();

    expect(screen.getByText('quality')).not.toHaveAttribute('tabindex');
  });

  test('states the source identifier only when one is given', () => {
    const { rerender } = renderPanel({ source: 'sessions' });

    expect(screen.getByText('sessions')).toBeInTheDocument();

    rerender(
      <SessionDetailPanel icon={null} iconClassName="" title="quality">
        <p>body</p>
      </SessionDetailPanel>,
    );

    expect(screen.queryByText('sessions')).toBeNull();
  });
});
