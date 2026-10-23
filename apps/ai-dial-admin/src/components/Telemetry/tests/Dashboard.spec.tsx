import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import Dashboard from '../Dashboard';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

describe('Dashboard view switching', () => {
  test('renders Chat view by default on Dashboard route', () => {
    render(<Dashboard route={ApplicationRoute.Dashboard} />);

    expect(screen.getByText(TelemetryI18nKey.SystemUsage)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.UniqueUsers)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.RequestCount)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: TelemetryI18nKey.ViewByLabel })).toBeInTheDocument();
  });

  test('does not show View by dropdown on Models route', () => {
    render(<Dashboard route={ApplicationRoute.Models} />);

    expect(screen.queryByRole('combobox', { name: TelemetryI18nKey.ViewByLabel })).toBeNull();
    expect(screen.getByText(TelemetryI18nKey.SystemUsage)).toBeInTheDocument();
  });

  test('shows View by dropdown on Applications route', () => {
    render(<Dashboard route={ApplicationRoute.Applications} />);

    expect(screen.getByRole('combobox', { name: TelemetryI18nKey.ViewByLabel })).toBeInTheDocument();
  });

  test('renders MCP-only view for Toolsets route without View by dropdown', () => {
    render(<Dashboard route={ApplicationRoute.Toolsets} />);

    expect(screen.queryByRole('combobox', { name: TelemetryI18nKey.ViewByLabel })).toBeNull();
    expect(screen.getByText(TelemetryI18nKey.RequestPerMcpUsage)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.TotalMcpCalls)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.TotalToolCalls)).toBeInTheDocument();
    expect(screen.queryByText(TelemetryI18nKey.SystemUsage)).toBeNull();
  });

  test('renders MCP-only view for Asset Toolsets route without View by dropdown', () => {
    render(<Dashboard route={ApplicationRoute.AssetsToolsets} />);

    expect(screen.queryByRole('combobox', { name: TelemetryI18nKey.ViewByLabel })).toBeNull();
    expect(screen.getByText(TelemetryI18nKey.RequestPerMcpUsage)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.TotalMcpCalls)).toBeInTheDocument();
  });
});
