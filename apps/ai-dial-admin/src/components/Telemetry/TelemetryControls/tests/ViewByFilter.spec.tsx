import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ViewByFilter from '../ViewByFilter';
import { DASHBOARD_VIEW_TYPE } from '@/src/types/telemetry';

describe('ViewByFilter', () => {
  test('renders with Chat value', () => {
    render(<ViewByFilter value={DASHBOARD_VIEW_TYPE.Chat} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: 'Telemetry.ViewByLabel' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Telemetry.ViewByLabel' })).toHaveDisplayValue(/Telemetry.ViewByLabel/);
  });

  test('renders with MCP value', () => {
    render(<ViewByFilter value={DASHBOARD_VIEW_TYPE.Mcp} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: 'Telemetry.ViewByLabel' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Telemetry.ViewByLabel' })).toHaveDisplayValue(/Telemetry.ViewByLabel/);
  });
});
