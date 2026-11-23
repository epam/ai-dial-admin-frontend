import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import SystemHealth from '@/src/components/EvalSystemHealth/SystemHealth';
import { MenuI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/EvalSystemHealth/CoverageCardRow', () => ({ default: () => <div>coverage row</div> }));
vi.mock('@/src/components/EvalSystemHealth/ActivityCardRow', () => ({ default: () => <div>activity row</div> }));

describe('SystemHealth', () => {
  test('renders the page heading above the coverage and activity card rows', () => {
    render(<SystemHealth />);

    expect(screen.getByRole('heading', { level: 1, name: MenuI18nKey.SystemHealth })).toBeTruthy();
    expect(screen.getByText('coverage row')).toBeTruthy();
    expect(screen.getByText('activity row')).toBeTruthy();
  });

  test('places the activity row after the coverage row', () => {
    render(<SystemHealth />);

    const coverage = screen.getByText('coverage row');
    const activity = screen.getByText('activity row');
    expect(coverage.compareDocumentPosition(activity) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
