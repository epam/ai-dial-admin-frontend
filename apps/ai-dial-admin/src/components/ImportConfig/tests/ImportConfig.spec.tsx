import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ImportConfig from '../ImportConfig';
import { ExportI18nKey, ImportI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/[lang]/import-config/actions', () => ({
  importJsonConfigs: vi.fn(),
  importZipConfig: vi.fn(),
  importDeploymentConfig: vi.fn(),
  previewJsonConfigs: vi.fn(),
  previewZipConfig: vi.fn(),
}));

vi.mock('@/src/components/EntityListView/Import/utils', () => ({
  isLargeFile: () => false,
}));

describe('ImportConfig', () => {
  test('does not show ConfigScopeSelector when deploymentsEnabled is false', () => {
    render(<ImportConfig />);

    expect(screen.queryByText(ExportI18nKey.Components)).not.toBeInTheDocument();
  });

  test('shows ConfigScopeSelector when deploymentsEnabled is true', () => {
    render(<ImportConfig deploymentsEnabled={true} />);

    expect(screen.getByText(ExportI18nKey.Components)).toBeInTheDocument();
    expect(screen.getByText(ExportI18nKey.EntitiesBuildersAccess)).toBeInTheDocument();
    expect(screen.getByText(ExportI18nKey.Deployments)).toBeInTheDocument();
  });

  test('hides file type radio group when Deployments is selected', () => {
    render(<ImportConfig deploymentsEnabled={true} />);

    expect(screen.getByText(ImportI18nKey.FileType)).toBeInTheDocument();

    fireEvent.click(screen.getByText(ExportI18nKey.Deployments));

    expect(screen.queryByText(ImportI18nKey.FileType)).not.toBeInTheDocument();
  });

  test('shows Override and Skip for deployment conflict resolution', () => {
    render(<ImportConfig deploymentsEnabled={true} />);

    fireEvent.click(screen.getByText(ExportI18nKey.Deployments));

    expect(screen.getByText(ImportI18nKey.Override)).toBeInTheDocument();
    expect(screen.getByText(ImportI18nKey.Skip)).toBeInTheDocument();
  });
});
