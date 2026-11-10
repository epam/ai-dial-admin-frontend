import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepStatus } from '@epam/ai-dial-ui-kit';
import { describe, expect, test, vi } from 'vitest';

import { CLIENT_SECRET_PLACEHOLDER } from '@/src/components/EntityListView/Import/constants';
import { ImportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialPrompt } from '@/src/models/dial/prompt';
import { FileImportMap } from '@/src/models/file';
import { ConflictResolutionPolicy } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import ImportConflicts from '../ImportConflicts';

describe('ImportConflicts', () => {
  const resolutions = [
    { id: ConflictResolutionPolicy.OVERRIDE, name: ImportI18nKey.Override },
    { id: ConflictResolutionPolicy.SKIP, name: ImportI18nKey.Skip },
  ];

  test('shows an editable preview for override resolution and keeps the step valid with conflicts', async () => {
    const filesMap = new Map<string, FileImportMap>([
      [
        'prompts.json',
        {
          files: [{ id: 'prompts/public/existing__1.0.0' } as DialPrompt],
          isInvalid: false,
        },
      ],
    ]);
    const setEditedFileMap = vi.fn();
    const setStepsState = vi.fn();
    const setResolution = vi.fn();

    const { container } = render(
      <ImportConflicts
        route={ApplicationRoute.Prompts}
        existing={[{ path: 'prompts/public/existing__1.0.0' } as DialPrompt]}
        filesMap={filesMap}
        resolutions={resolutions}
        resolution={ConflictResolutionPolicy.OVERRIDE}
        setResolution={setResolution}
        setEditedFileMap={setEditedFileMap}
        setStepsState={setStepsState}
      />,
    );

    expect(screen.getByText(ImportI18nKey.ConflictResolution)).toBeInTheDocument();
    expect(screen.getByText(`${MenuI18nKey.Prompts}: 1`)).toBeInTheDocument();
    expect(screen.queryByText(ImportI18nKey.EditManually)).not.toBeInTheDocument();

    await vi.waitFor(() => expect(setEditedFileMap).toHaveBeenCalledWith(filesMap));
    await vi.waitFor(() => expect(setStepsState).toHaveBeenCalledWith(StepStatus.VALID));
    await waitFor(() => expect(container.querySelector('.ag-error-row')).toBeInTheDocument());
  });
});

describe('ImportConflicts client secrets', () => {
  const resolutions = [
    { id: ConflictResolutionPolicy.OVERRIDE, name: ImportI18nKey.Override },
    { id: ConflictResolutionPolicy.SKIP, name: ImportI18nKey.Skip },
  ];

  const toolsetsMap = (authenticationType: string) =>
    new Map<string, FileImportMap>([
      [
        'toolsets.json',
        {
          files: [
            {
              id: 'toolsets/public/github__1.0.0',
              name: 'github',
              version: '1.0.0',
              auth_settings: { authentication_type: authenticationType },
            } as unknown as AssetApp,
          ],
          isInvalid: false,
        },
      ],
    ]);

  const renderConflicts = (props: Partial<React.ComponentProps<typeof ImportConflicts>> = {}) =>
    render(
      <ImportConflicts
        route={ApplicationRoute.AssetsToolsets}
        existing={[]}
        filesMap={toolsetsMap('OAUTH')}
        resolutions={resolutions}
        resolution={ConflictResolutionPolicy.SKIP}
        setResolution={vi.fn()}
        setEditedFileMap={vi.fn()}
        setStepsState={vi.fn()}
        withClientSecret
        {...props}
      />,
    );

  test('warns about OAUTH toolsets and offers a masked client secret defaulting to the placeholder', async () => {
    renderConflicts();

    expect(screen.getByText(ImportI18nKey.ClientSecretWarningTitle)).toBeTruthy();
    expect(await screen.findByText(ImportI18nKey.ClientSecretColumn)).toBeTruthy();

    const input = await screen.findByLabelText(ImportI18nKey.ClientSecretInputLabel);
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveValue(CLIENT_SECRET_PLACEHOLDER);
  });

  test('keeps the details out of sight until the banner is hovered, and exposes them to screen readers meanwhile', async () => {
    const user = userEvent.setup();
    renderConflicts();

    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(screen.getAllByText(ImportI18nKey.ClientSecretWarning)).toHaveLength(1);

    await user.hover(screen.getByText(ImportI18nKey.ClientSecretWarningTitle));

    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText(ImportI18nKey.ClientSecretWarning)).toBeTruthy();
  });

  test('puts the Override line in the tooltip too while Override is selected', async () => {
    const user = userEvent.setup();
    renderConflicts({ resolution: ConflictResolutionPolicy.OVERRIDE });

    await user.hover(screen.getByText(ImportI18nKey.ClientSecretWarningTitle));

    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText(ImportI18nKey.ClientSecretOverrideWarning)).toBeTruthy();
  });

  test('shows the Override line only while Override is selected', () => {
    const { rerender } = renderConflicts({ resolution: ConflictResolutionPolicy.OVERRIDE });

    expect(screen.getByText(ImportI18nKey.ClientSecretOverrideWarning)).toBeTruthy();

    rerender(
      <ImportConflicts
        route={ApplicationRoute.AssetsToolsets}
        existing={[]}
        filesMap={toolsetsMap('OAUTH')}
        resolutions={resolutions}
        resolution={ConflictResolutionPolicy.SKIP}
        setResolution={vi.fn()}
        setEditedFileMap={vi.fn()}
        setStepsState={vi.fn()}
        withClientSecret
      />,
    );

    expect(screen.queryByText(ImportI18nKey.ClientSecretOverrideWarning)).toBeNull();
    expect(screen.getByText(ImportI18nKey.ClientSecretWarningTitle)).toBeTruthy();
  });

  test('shows nothing extra when the behavior is off', async () => {
    renderConflicts({ withClientSecret: false });

    expect(await screen.findByText(`${MenuI18nKey.Toolsets}: 1`)).toBeTruthy();
    expect(screen.queryByText(ImportI18nKey.ClientSecretWarningTitle)).toBeNull();
    expect(screen.queryByText(ImportI18nKey.ClientSecretColumn)).toBeNull();
  });

  test('shows nothing extra when no toolset is OAUTH', async () => {
    renderConflicts({ filesMap: toolsetsMap('API_KEY') });

    expect(await screen.findByText(`${MenuI18nKey.Toolsets}: 1`)).toBeTruthy();
    expect(screen.queryByText(ImportI18nKey.ClientSecretWarningTitle)).toBeNull();
    expect(screen.queryByText(ImportI18nKey.ClientSecretColumn)).toBeNull();
  });
});
