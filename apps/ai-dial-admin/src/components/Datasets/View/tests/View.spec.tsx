import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getDatasetByName, updateDataset } from '@/src/app/[lang]/datasets/actions';
import { Dataset, DatasetVisibility } from '@/src/models/evaluation/dataset';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import DatasetView from '../View';

const header = vi.hoisted(() => ({ props: undefined as any }));
const tabsContent = vi.hoisted(() => ({ props: undefined as any }));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: (props: any) => {
    header.props = props;
    return <div>header</div>;
  },
}));

vi.mock('../TabsContent', () => ({
  default: (props: any) => {
    tabsContent.props = props;
    return <div>tabs content</div>;
  },
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: () => <div>json editor</div>,
}));

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getDatasetByName: vi.fn(),
  removeDataset: vi.fn(),
  transitionVisibility: vi.fn(),
  updateDataset: vi.fn(),
  updateTestCases: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const dataset = (visibility: DatasetVisibility): Dataset => ({
  id: 'ds-1',
  name: 'ds',
  visibility,
  testCaseSchema: [],
});

describe('DatasetView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('offers Properties, Schema, Test Cases and Test Suites tabs in that order', () => {
    render(<DatasetView originalDataset={dataset(DatasetVisibility.PUBLIC)} etag="e" />);

    expect(header.props.tabs.map((tab: { id: EntityViewTab }) => tab.id)).toEqual([
      EntityViewTab.Properties,
      EntityViewTab.Schema,
      EntityViewTab.TestCases,
      EntityViewTab.TestSuites,
    ]);
  });

  test('disables the JSON Editor toggle when the schema is read-only', () => {
    render(<DatasetView originalDataset={dataset(DatasetVisibility.PUBLIC)} etag="e" isSchemaReadOnly />);

    expect(header.props.jsonConfiguration.isEditorDisabled).toBe(true);
    expect(tabsContent.props.isSchemaReadOnly).toBe(true);
  });

  test.each([DatasetVisibility.PUBLIC, DatasetVisibility.PRIVATE])(
    'keeps the JSON Editor toggle enabled for an unlocked %s dataset',
    (visibility) => {
      render(<DatasetView originalDataset={dataset(visibility)} etag="e" />);

      expect(header.props.jsonConfiguration.isEditorDisabled).toBe(false);
      expect(tabsContent.props.isSchemaReadOnly).toBe(false);
    },
  );

  test('shows the tabs, not the JSON editor, while the toggle is locked', () => {
    render(<DatasetView originalDataset={dataset(DatasetVisibility.PUBLIC)} etag="e" isSchemaReadOnly />);

    expect(screen.getByText('tabs content')).toBeTruthy();
    expect(screen.queryByText('json editor')).toBeNull();
  });

  test('re-enables the grid refresh once the saved dataset is reloaded', () => {
    const { rerender } = render(<DatasetView originalDataset={dataset(DatasetVisibility.PUBLIC)} etag="e" />);

    act(() => tabsContent.props.onChange({ ...dataset(DatasetVisibility.PUBLIC), name: 'renamed' }, true));
    expect(tabsContent.props.isSkipRefresh).toBe(true);

    rerender(<DatasetView originalDataset={{ ...dataset(DatasetVisibility.PUBLIC), name: 'renamed' }} etag="e2" />);
    expect(tabsContent.props.isSkipRefresh).toBe(false);
  });

  describe('after a successful save', () => {
    const renamed = { ...dataset(DatasetVisibility.PUBLIC), name: 'renamed' };

    const saveRenamed = async () => {
      vi.mocked(getDatasetByName).mockResolvedValue({ content: [] } as never);
      vi.mocked(updateDataset).mockResolvedValue({ success: true, etag: 'e2' } as never);
      const view = render(<DatasetView originalDataset={dataset(DatasetVisibility.PUBLIC)} etag="e" />);
      act(() => tabsContent.props.onChange(renamed, true));
      expect(header.props.isChanged).toBe(true);

      await act(async () => header.props.onSave());
      return view;
    };

    test('stops reporting changes before the saved dataset is reloaded', async () => {
      await saveRenamed();

      expect(header.props.isChanged).toBe(false);
    });

    test('discards back to the saved dataset while the reload is pending', async () => {
      await saveRenamed();
      act(() => tabsContent.props.onChange({ ...renamed, name: 'typed later' }, true));
      expect(header.props.isChanged).toBe(true);

      act(() => header.props.onDiscard());

      expect(tabsContent.props.selectedDataset.name).toBe('renamed');
      expect(header.props.isChanged).toBe(false);
    });

    test('adopts the reloaded dataset when nothing was edited in the meantime', async () => {
      const { rerender } = await saveRenamed();
      const reloaded = { ...renamed, updatedAt: 1 };

      rerender(<DatasetView originalDataset={reloaded} etag="e2" />);

      expect(tabsContent.props.selectedDataset).toEqual(reloaded);
      expect(header.props.isChanged).toBe(false);
    });

    test('keeps edits made while the reload was pending', async () => {
      const { rerender } = await saveRenamed();
      act(() => tabsContent.props.onChange({ ...renamed, name: 'typed later' }, true));

      rerender(<DatasetView originalDataset={renamed} etag="e2" />);

      expect(tabsContent.props.selectedDataset.name).toBe('typed later');
      expect(header.props.isChanged).toBe(true);
    });
  });

  test('visiting the Test Suites tab does not mark the dataset changed', () => {
    render(<DatasetView originalDataset={dataset(DatasetVisibility.PUBLIC)} etag="e" />);

    act(() => header.props.onChangeActiveTab(EntityViewTab.TestSuites));

    expect(header.props.activeTab).toBe(EntityViewTab.TestSuites);
    expect(header.props.isChanged).toBe(false);
  });
});
