import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ConfigScopeSelector from '@/src/components/Common/ConfigScopeSelector/ConfigScopeSelector';
import { ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ExportComponentType } from '@/src/types/export';

describe('ConfigScopeSelector', () => {
  test('renders only the given scopes', () => {
    render(
      <ConfigScopeSelector
        scopes={[ExportComponentType.ADMIN, ExportComponentType.DEPLOYMENTS]}
        selectedScope={ExportComponentType.ADMIN}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(ExportI18nKey.Components)).toBeInTheDocument();
    expect(screen.getByText(ExportI18nKey.EntitiesBuildersAccess)).toBeInTheDocument();
    expect(screen.getByText(ExportI18nKey.Deployments)).toBeInTheDocument();
    expect(screen.queryByText(MenuI18nKey.Analytics)).toBeNull();
  });

  test('renders the three scopes in the given order', () => {
    render(
      <ConfigScopeSelector
        scopes={[ExportComponentType.ADMIN, ExportComponentType.DEPLOYMENTS, ExportComponentType.ANALYTICS]}
        selectedScope={ExportComponentType.ANALYTICS}
        onChange={vi.fn()}
      />,
    );

    const text = document.body.textContent ?? '';
    const positions = [ExportI18nKey.EntitiesBuildersAccess, ExportI18nKey.Deployments, MenuI18nKey.Analytics].map(
      (label) => text.indexOf(label),
    );
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});
