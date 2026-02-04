import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Events from '../Events';
import { ApplicationRoute } from '@/src/types/routes';
import { EntitiesI18nKey } from '@/src/constants/i18n';

describe('Events', () => {
  test('renders with empty events', () => {
    render(<Events route={ApplicationRoute.McpContainers} events={[]} />);

    expect(screen.getByText(EntitiesI18nKey.NoEvents)).toBeInTheDocument();
  });

  test('renders with events', () => {
    const events = [
      {
        id: '1',
        message: 'Event 1',
        reason: 'Reason 1',
        count: 1,
        firstTimestamp: Date.now(),
      },
    ] as any;

    render(<Events route={ApplicationRoute.McpContainers} events={events} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
