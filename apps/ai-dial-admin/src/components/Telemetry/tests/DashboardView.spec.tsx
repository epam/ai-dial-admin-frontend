import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import DashboardView from '../DashboardView';
import { MenuI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';

describe('DashboardView', () => {
  test('renders dashboard title and dashboard component', () => {
    render(<DashboardView />);
    expect(screen.getByText(MenuI18nKey.Dashboard)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.SystemUsage)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.UniqueUsers)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.RequestCount)).toBeInTheDocument();
  });

  test('renders grafana link if grafanaLink is provided', () => {
    render(<DashboardView grafanaLink="https://grafana.example.com" />);
    expect(screen.getByText(TelemetryI18nKey.Grafana)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.Grafana)).toBeInTheDocument();
  });

  test('does not render grafana link if grafanaLink is not provided', () => {
    render(<DashboardView />);
    expect(screen.queryByText(TelemetryI18nKey.Grafana)).toBeNull();
  });
});
