import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import Dashboard from '../Dashboard';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

describe('Dashboard view switching', () => {
  test('renders Chat view by default on Dashboard route', () => {
    const { container } = render(<Dashboard route={ApplicationRoute.Dashboard} />);

    expect(screen.getByText(TelemetryI18nKey.SystemUsage)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.UniqueUsers)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.RequestCount)).toBeInTheDocument();
    expect(container.textContent).toContain(TelemetryI18nKey.ViewByLabel);
  });

  test('does not show View by dropdown on Models route', () => {
    const { container } = render(<Dashboard route={ApplicationRoute.Models} />);

    expect(container.textContent).not.toContain(TelemetryI18nKey.ViewByLabel);
    expect(screen.getByText(TelemetryI18nKey.SystemUsage)).toBeInTheDocument();
  });

  test('shows View by dropdown on Applications route', () => {
    const { container } = render(<Dashboard route={ApplicationRoute.Applications} />);

    expect(container.textContent).toContain(TelemetryI18nKey.ViewByLabel);
  });

  test('renders MCP-only view for Toolsets route without View by dropdown', () => {
    const { container } = render(<Dashboard route={ApplicationRoute.Toolsets} />);

    expect(container.textContent).not.toContain(TelemetryI18nKey.ViewByLabel);
    expect(screen.getByText(TelemetryI18nKey.RequestPerMcpUsage)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.TotalMcpCalls)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.TotalToolCalls)).toBeInTheDocument();
    expect(screen.queryByText(TelemetryI18nKey.SystemUsage)).toBeNull();
  });

  test('renders MCP-only view for Asset Toolsets route without View by dropdown', () => {
    const { container } = render(<Dashboard route={ApplicationRoute.AssetsToolsets} />);

    expect(container.textContent).not.toContain(TelemetryI18nKey.ViewByLabel);
    expect(screen.getByText(TelemetryI18nKey.RequestPerMcpUsage)).toBeInTheDocument();
    expect(screen.getByText(TelemetryI18nKey.TotalMcpCalls)).toBeInTheDocument();
  });
});
