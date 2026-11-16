import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ViewByFilter from '../ViewByFilter';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { DASHBOARD_VIEW_TYPE } from '@/src/types/telemetry';

describe('ViewByFilter', () => {
  test('renders with Chat value', () => {
    render(<ViewByFilter value={DASHBOARD_VIEW_TYPE.Chat} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: new RegExp(`^${TelemetryI18nKey.ViewByLabel}`) })).toHaveAccessibleName(
      new RegExp(TelemetryI18nKey.ViewByChat),
    );
  });

  test('renders with MCP value', () => {
    render(<ViewByFilter value={DASHBOARD_VIEW_TYPE.Mcp} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: new RegExp(`^${TelemetryI18nKey.ViewByLabel}`) })).toHaveAccessibleName(
      new RegExp(TelemetryI18nKey.ViewByMcp),
    );
  });
});
