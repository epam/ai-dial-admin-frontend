import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ConfigScopeSelector from '../ConfigScopeSelector';
import { ExportComponentType } from '@/src/types/export';
import { ExportI18nKey } from '@/src/constants/i18n';

describe('ConfigScopeSelector', () => {
  test('renders Admin and Deployments radio options', () => {
    render(<ConfigScopeSelector selectedScope={ExportComponentType.ADMIN} onChange={vi.fn()} />);

    expect(screen.getByText(ExportI18nKey.EntitiesBuildersAccess)).toBeInTheDocument();
    expect(screen.getByText(ExportI18nKey.Deployments)).toBeInTheDocument();
  });

  test('renders with Deployments selected', () => {
    render(<ConfigScopeSelector selectedScope={ExportComponentType.DEPLOYMENTS} onChange={vi.fn()} />);

    expect(screen.getByText(ExportI18nKey.Components)).toBeInTheDocument();
  });
});
