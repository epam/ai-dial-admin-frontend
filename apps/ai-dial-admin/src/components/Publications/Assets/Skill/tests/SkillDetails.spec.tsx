import { ColDef } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { DialSkillResource } from '@/src/models/dial/resource';
import SkillDetails from '../SkillDetails';

let capturedGridProps: { rowData?: unknown[]; columnDefs?: ColDef[] } = {};

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: { rowData?: unknown[]; columnDefs?: ColDef[] }) => {
    capturedGridProps = props;
    return <section aria-label="skill-files" />;
  },
}));

// The mocked `t()` returns the raw i18n key, and `ActionMenuOperationI18nKey` values already are the
// `id` these action builders use — this local helper just documents that so assertions read plainly.
function actionId(key: 'Preview' | 'Download' | 'Remove') {
  return `ActionMenuOperation.${key}`;
}

const buildSkill = (overrides: Partial<DialSkillResource> = {}): DialSkillResource => ({
  name: 'my-skill',
  path: 'review/my-skill',
  folderId: 'review/',
  files: [{ name: 'existing.md' }],
  ...overrides,
});

describe('Publications :: SkillDetails', () => {
  test('renders the file list title with the file count', () => {
    render(<SkillDetails skill={buildSkill()} />);

    expect(screen.getByText(`${PublicationsI18nKey.FilesListTitle}: 1`)).toBeInTheDocument();
  });

  test('renders nothing when no skill is given', () => {
    const { container } = render(<SkillDetails skill={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('always includes an actions column with preview, download, and remove operations', () => {
    render(<SkillDetails skill={buildSkill()} />);

    const actionsColumn = capturedGridProps.columnDefs?.find((col) => col.field === ACTIONS_COLUMN_CEL_ID);
    expect(actionsColumn).toBeDefined();
    const items = (actionsColumn?.cellRendererParams as { items: { id: string }[] })?.items;
    expect(items?.map((item) => item.id)).toEqual([actionId('Preview'), actionId('Download'), actionId('Remove')]);
  });

  test('hides preview and download for a staged, not-yet-uploaded file', () => {
    const file = new File(['content'], 'notes.md');
    render(<SkillDetails skill={buildSkill()} addedFiles={[file]} />);

    expect(capturedGridProps.rowData).toEqual([{ name: 'existing.md' }, { name: 'notes.md', isNew: true }]);
    const actionsColumn = capturedGridProps.columnDefs?.find((col) => col.field === ACTIONS_COLUMN_CEL_ID);
    const items = (
      actionsColumn?.cellRendererParams as { items: { id: string; hidden?: (a: unknown, n: unknown) => boolean }[] }
    )?.items;
    const previewItem = items?.find((item) => item.id === actionId('Preview'));
    const downloadItem = items?.find((item) => item.id === actionId('Download'));

    expect(previewItem?.hidden?.(undefined, { data: { name: 'notes.md', isNew: true } } as never)).toBe(true);
    expect(downloadItem?.hidden?.(undefined, { data: { name: 'notes.md', isNew: true } } as never)).toBe(true);
    expect(previewItem?.hidden?.(undefined, { data: { name: 'existing.md' } } as never)).toBe(false);
  });

  test('excludes files staged for removal from the row list', () => {
    render(
      <SkillDetails
        skill={buildSkill({ files: [{ name: 'existing.md' }, { name: 'notes.md' }] })}
        removedFileNames={['notes.md']}
      />,
    );

    expect(capturedGridProps.rowData).toEqual([{ name: 'existing.md' }]);
  });

  describe('disabled (e.g. read-only admin)', () => {
    test('renders no Add-file button', () => {
      render(<SkillDetails skill={buildSkill()} disabled />);

      expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
    });
  });

  describe('enabled add/remove', () => {
    test('renders an Add-file button that stages a selected file via onAddFile', async () => {
      const user = userEvent.setup();
      const onAddFile = vi.fn();
      render(<SkillDetails skill={buildSkill()} onAddFile={onAddFile} />);

      const file = new File(['content'], 'notes.md', { type: 'text/markdown' });
      const input = screen.getByLabelText(/add/i, { selector: 'input' });
      await user.upload(input, file);

      expect(onAddFile).toHaveBeenCalledWith(file);
    });

    test('removing an existing file calls onRemoveExistingFile with its name', () => {
      const onRemoveExistingFile = vi.fn();
      render(
        <SkillDetails
          skill={buildSkill({ files: [{ name: 'notes.md' }] })}
          onRemoveExistingFile={onRemoveExistingFile}
        />,
      );

      const actionsColumn = capturedGridProps.columnDefs?.find((col) => col.field === ACTIONS_COLUMN_CEL_ID);
      const removeItem = (
        actionsColumn?.cellRendererParams as { items: { id: string; onClick: (row: unknown) => void }[] }
      )?.items.find((item) => item.id === actionId('Remove'));

      removeItem?.onClick({ name: 'notes.md' });

      expect(onRemoveExistingFile).toHaveBeenCalledWith('notes.md');
    });

    test('removing a staged added file calls onRemoveAddedFile with its index', () => {
      const file = new File(['content'], 'notes.md');
      const onRemoveAddedFile = vi.fn();
      render(<SkillDetails skill={buildSkill()} addedFiles={[file]} onRemoveAddedFile={onRemoveAddedFile} />);

      const actionsColumn = capturedGridProps.columnDefs?.find((col) => col.field === ACTIONS_COLUMN_CEL_ID);
      const removeItem = (
        actionsColumn?.cellRendererParams as { items: { id: string; onClick: (row: unknown) => void }[] }
      )?.items.find((item) => item.id === actionId('Remove'));

      removeItem?.onClick({ name: 'notes.md', isNew: true });

      expect(onRemoveAddedFile).toHaveBeenCalledWith(0);
    });
  });
});
