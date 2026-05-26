import { render, screen, waitFor } from '@testing-library/react';
import { StepStatus } from '@epam/ai-dial-ui-kit';
import { describe, expect, test, vi } from 'vitest';

import { ImportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
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

    await waitFor(() => expect(setEditedFileMap).toHaveBeenCalledWith(filesMap));
    await waitFor(() => expect(setStepsState).toHaveBeenCalledWith(StepStatus.VALID));
    await waitFor(() => expect(container.querySelector('.ag-error-row')).toBeInTheDocument());
  });
});
