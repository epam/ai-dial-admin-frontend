import { act, fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => false,
}));

vi.mock('@/src/hooks/use-time-filter', () => ({
  useTimeFilter: () => ({
    timePeriod: 'last_7_days',
    timeRange: { startDate: new Date(0), endDate: new Date(0) },
    isCustom: false,
    onTimePeriodChange: vi.fn(),
    onTimeRangeChange: vi.fn(),
  }),
}));

vi.mock('@/src/components/Common/TimeFilter/TimeFilter', () => ({
  __esModule: true,
  default: () => <div />,
}));

vi.mock('@/src/components/ListView/Header/ResetFiltersButton', () => ({
  __esModule: true,
  default: () => <button>ResetFilters</button>,
}));

vi.mock('@/src/components/ListView/ListView', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/src/components/ActivityAudit/Modals/Details', () => ({
  __esModule: true,
  default: () => null,
}));

const getActivitiesMock = vi.fn().mockResolvedValue({ data: [], total: 0, totalPages: 0 });
const getDeploymentActivitiesMock = vi.fn().mockResolvedValue({ data: [], total: 0, totalPages: 0 });
vi.mock('@/src/app/[lang]/activity-audit/actions', () => ({
  getActivities: (...args: unknown[]) => getActivitiesMock(...args),
  getDeploymentActivities: (...args: unknown[]) => getDeploymentActivitiesMock(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialConfirmationPopup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialGhostButton: ({ label }: { label: string }) => <button>{label}</button>,
    DialNeutralButton: ({ label }: { label: string }) => <button>{label}</button>,
    DialTooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
    DialSelect: ({
      options,
      value,
      onChange,
    }: {
      options: { value: string; label: string; disabled?: boolean }[];
      value: string;
      onChange: (v: string) => void;
    }) => (
      <select aria-label="View" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    ),
  };
});

import ActivityAuditList from '@/src/components/ActivityAudit/List/List';
import { ButtonsI18nKey, RollbackI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { ActivityAuditView } from '@/src/types/activity-audit';

describe('ActivityAuditList :: view-aware behavior', () => {
  beforeEach(() => {
    getActivitiesMock.mockClear();
    getDeploymentActivitiesMock.mockClear();
  });

  test('renders Rollback button by default (Config view)', () => {
    render(<ActivityAuditList />);
    expect(screen.getByText(RollbackI18nKey.Rollback)).toBeInTheDocument();
  });

  test('hides Rollback button after switching to Deployments view', () => {
    render(<ActivityAuditList />);
    act(() => {
      fireEvent.change(screen.getByLabelText('View'), { target: { value: 'Deployments' } });
    });
    expect(screen.queryByText(RollbackI18nKey.Rollback)).not.toBeInTheDocument();
  });

  test('restores Rollback button when switching back to Config view', () => {
    render(<ActivityAuditList />);
    act(() => {
      fireEvent.change(screen.getByLabelText('View'), { target: { value: 'Deployments' } });
    });
    act(() => {
      fireEvent.change(screen.getByLabelText('View'), { target: { value: 'Config' } });
    });
    expect(screen.getByText(RollbackI18nKey.Rollback)).toBeInTheDocument();
  });

  test('renders the Deployments view option and Refresh control', () => {
    render(<ActivityAuditList />);
    const options = Array.from(screen.getByLabelText('View').querySelectorAll('option'));
    const values = options.map((o) => (o as HTMLOptionElement).value);
    expect(values).toContain('Config');
    expect(values).toContain('Deployments');
    expect(values).toContain('Asset');
    expect(screen.getByText(ButtonsI18nKey.Refresh)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.ActivityViewDeployments)).toBeInTheDocument();
  });

  test('hides the View dropdown when viewMode is provided', () => {
    render(<ActivityAuditList viewMode={ActivityAuditView.Deployments} />);
    expect(screen.queryByLabelText('View')).not.toBeInTheDocument();
  });

  test('hides the Rollback button when viewMode forces Deployments', () => {
    render(<ActivityAuditList viewMode={ActivityAuditView.Deployments} />);
    expect(screen.queryByText(RollbackI18nKey.Rollback)).not.toBeInTheDocument();
  });

  test('still renders the Rollback button when viewMode forces Config', () => {
    render(<ActivityAuditList viewMode={ActivityAuditView.Config} />);
    expect(screen.getByText(RollbackI18nKey.Rollback)).toBeInTheDocument();
  });
});
