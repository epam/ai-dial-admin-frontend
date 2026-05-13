import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { ImportI18nKey } from '@/src/constants/i18n';
import { DeploymentImportPreviewResponse } from '@/src/models/deployments/preview';
import { ExportConfigComponentType } from '@/src/types/deployments/import';
import { ImportFileType } from '@/src/types/import';

const { mockPreview, mockShowNotification } = vi.hoisted(() => ({
  mockPreview: vi.fn(),
  mockShowNotification: vi.fn(),
}));

vi.mock('@/src/app/[lang]/import-config/actions', () => ({
  previewJsonConfigs: vi.fn(),
  previewZipConfig: vi.fn(),
  previewDeploymentImportConfig: mockPreview,
}));

vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest: () => (fn: (body: unknown) => Promise<unknown>, body: unknown) => fn(body),
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialTooltip: ({ children }: { children: ReactNode; tooltip?: ReactNode }) => <>{children}</>,
    DialTabs: ({
      tabs,
      onClick,
    }: {
      tabs: Array<{ id: string; label: ReactNode; invalid?: boolean }>;
      onClick: (id: string) => void;
    }) => (
      <div data-testid="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-invalid={tab.invalid ? 'true' : 'false'}
            onClick={() => onClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    ),
  };
});

const ConfigurationPreview = (await import('../ConfigurationPreview')).default;

const baseResponse = (): DeploymentImportPreviewResponse => ({
  mcpDeployments: [],
  adapterDeployments: [],
  applicationDeployments: [],
  interceptorDeployments: [],
  nimDeployments: [],
  inferenceDeployments: [],
  mcpImageDefinitions: [],
  adapterImageDefinitions: [],
  applicationImageDefinitions: [],
  interceptorImageDefinitions: [],
  globalImageBuildDomainWhitelist: null,
});

const buildFormData = () => {
  const fd = new FormData();
  fd.append('resolutionPolicy', 'OVERWRITE');
  fd.append('file', new File(['x'], 'config.zip'));
  return fd;
};

const renderPreview = () =>
  render(
    <ConfigurationPreview
      isImporting={false}
      importBody={buildFormData()}
      files={[new File(['x'], 'config.zip')]}
      fileType={ImportFileType.ARCHIVE}
      isDeployments
      onImportFile={vi.fn()}
    />,
  );

describe('ConfigurationPreview (deployments) — validation', () => {
  test('renders banner and disables Import when validationErrors exist', async () => {
    const response = baseResponse();
    response.mcpDeployments = [
      {
        importAction: 'create',
        next: { name: 'echo', displayName: 'Echo' },
      },
    ];
    response.validationErrors = [
      {
        entityType: ExportConfigComponentType.MCP_DEPLOYMENT,
        entityIdentifier: 'echo',
        fieldPath: 'name',
        message: 'invalid',
      },
    ];
    mockPreview.mockResolvedValue({ success: true, response });

    renderPreview();

    await waitFor(() => {
      expect(screen.getByText(ImportI18nKey.ValidationBannerHeading)).toBeInTheDocument();
    });
    const importButton = screen.getByRole('button', { name: /Buttons\.Import/i });
    expect(importButton).toBeDisabled();
  });

  test('hides banner and enables Import when there are no errors', async () => {
    const response = baseResponse();
    response.mcpDeployments = [
      {
        importAction: 'create',
        next: { name: 'echo', displayName: 'Echo' },
      },
    ];
    mockPreview.mockResolvedValue({ success: true, response });

    renderPreview();

    await waitFor(() => {
      expect(screen.queryByText(ImportI18nKey.ValidationBannerHeading)).not.toBeInTheDocument();
    });
    const importButton = screen.getByRole('button', { name: /Buttons\.Import/i });
    expect(importButton).not.toBeDisabled();
  });

  test('failed preview surfaces error notification and does not render banner', async () => {
    mockShowNotification.mockClear();
    mockPreview.mockResolvedValue({
      success: false,
      errorHeader: 'header',
      errorMessage: 'message',
      requestId: 'req-1',
    });

    renderPreview();

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalled();
    });
    expect(screen.queryByText(ImportI18nKey.ValidationBannerHeading)).not.toBeInTheDocument();
  });

  test('banner shows the global total across tabs and stays visible on tab switch', async () => {
    const response = baseResponse();
    response.mcpDeployments = [{ importAction: 'create', next: { name: 'echo', displayName: 'Echo' } }];
    response.adapterDeployments = [{ importAction: 'create', next: { name: 'a-1', displayName: 'A1' } }];
    response.validationErrors = [
      {
        entityType: ExportConfigComponentType.MCP_DEPLOYMENT,
        entityIdentifier: 'echo',
        fieldPath: 'name',
        message: 'invalid',
      },
      {
        entityType: ExportConfigComponentType.ADAPTER_DEPLOYMENT,
        entityIdentifier: 'a-1',
        fieldPath: 'name',
        message: 'invalid',
      },
    ];
    mockPreview.mockResolvedValue({ success: true, response });

    renderPreview();

    await waitFor(() => {
      expect(screen.getByText(ImportI18nKey.ValidationBannerHeading)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/AdapterContainers/i));
    expect(screen.getByText(ImportI18nKey.ValidationBannerHeading)).toBeInTheDocument();
  });
});
