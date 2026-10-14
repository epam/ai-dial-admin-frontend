import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { Dataset, DatasetVisibility } from '@/src/models/evaluation/dataset';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import DatasetView from '../View';

const header = vi.hoisted(() => ({ props: undefined as any }));
const tabsContent = vi.hoisted(() => ({ props: undefined as any }));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: (props: any) => {
    header.props = props;
    return <div data-testid="header" />;
  },
}));

vi.mock('../TabsContent', () => ({
  default: (props: any) => {
    tabsContent.props = props;
    return <div data-testid="tabs-content" />;
  },
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: () => <div data-testid="json-editor" />,
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

    expect(screen.getByTestId('tabs-content')).toBeInTheDocument();
    expect(screen.queryByTestId('json-editor')).not.toBeInTheDocument();
  });

  test('visiting the Test Suites tab does not mark the dataset changed', () => {
    render(<DatasetView originalDataset={dataset(DatasetVisibility.PUBLIC)} etag="e" />);

    act(() => header.props.onChangeActiveTab(EntityViewTab.TestSuites));

    expect(header.props.activeTab).toBe(EntityViewTab.TestSuites);
    expect(header.props.isChanged).toBe(false);
  });
});
