import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import TestSuiteView from '../View';

// Mock the actions
vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  updateTestSuite: vi.fn(),
  removeTestSuite: vi.fn(),
  getDeployments: vi.fn().mockResolvedValue({
    success: true,
    response: [
      {
        deploymentId: 'deployment-1',
        $type: 'some-app-type',
        name: 'Deployment 1',
      },
    ],
  }),
  getDeploymentById: vi.fn().mockResolvedValue({
    deploymentId: 'deployment-1',
    $type: 'dial-application',
  }),
}));

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getDataset: vi.fn().mockResolvedValue({
    response: { id: 'dataset-1', name: 'Dataset 1', testCaseSchema: [] },
    etag: 'dataset-etag',
  }),
  updateDataset: vi.fn(),
  updateTestCases: vi.fn(),
}));

// Mock next/navigation
const mockRefresh = vi.fn();
const mockRouter = {
  refresh: mockRefresh,
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

const mockCloseSidebar = vi.fn();
const mockToggleSidebar = vi.fn();
const mockToggleIsMenuClosed = vi.fn();

let mockSidebar = {
  show: false,
  content: null,
  isMenuClosed: false,
  closeSidebar: mockCloseSidebar,
  showSidebar: vi.fn(),
  toggleIsMenuClosed: mockToggleIsMenuClosed,
};

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: mockSidebar,
    toggleSidebar: mockToggleSidebar,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: vi.fn(() => '/test-suites/123'),
}));

// Mock the child components
vi.mock('@/src/components/TestSuites/View/TabsContent', () => ({
  default: ({ activeTab, selectedTestSuite, onChange, onChangeDataset }: any) => (
    <div>
      <div>Active Tab: {activeTab}</div>
      <div>Test Suite: {selectedTestSuite.name}</div>
      <button onClick={() => onChange({ ...selectedTestSuite, name: 'Modified Suite' })}>Modify Suite</button>
      <button
        onClick={() => onChangeDataset({ id: 'dataset-1', name: 'Dataset 1', testCaseSchema: [{ name: 'renamed' }] })}
      >
        Update dataset schema
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({
    entity,
    isChanged,
    isSaving,
    onDiscard,
    onSave,
    tabs,
    activeTab,
    onChangeActiveTab,
    jsonConfiguration,
  }: any) => (
    <div>
      <div>Entity: {entity.name}</div>
      <div>Changed: {isChanged.toString()}</div>
      <button onClick={onDiscard}>Discard</button>
      <button onClick={onSave} disabled={isSaving}>
        Save
      </button>
      <button onClick={() => onChangeActiveTab(EntityViewTab.TestCases)}>Change Tab</button>
      <button onClick={jsonConfiguration.onToggleEditor}>Toggle Editor</button>
    </div>
  ),
}));

vi.mock('@/src/components/EntityView/JsonEditor/JsonEditor', () => ({
  default: ({ entity, setSelectedEntity, setIsChanged }: any) => (
    <div>
      <div>JSON Editor for: {entity.name}</div>
      <button
        onClick={() => {
          setSelectedEntity({ ...entity, name: 'Edited via JSON' });
          setIsChanged(true);
        }}
      >
        Edit JSON
      </button>
    </div>
  ),
}));

describe('TestSuiteView', () => {
  const mockTestSuite: TestSuite = {
    id: 'test-suite-1',
    name: 'Test Suite 1',
    description: 'Test description',
    status: 'active',
    createdBy: 'user@example.com',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    deploymentRef: {
      id: 'deployment-1',
      name: 'Deployment 1',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders TestSuiteView with initial state', () => {
    render(<TestSuiteView originalTestSuite={mockTestSuite} etag="etag" />);

    expect(screen.getByText('Entity: Test Suite 1')).toBeInTheDocument();
    expect(screen.getByText('Changed: false')).toBeInTheDocument();
  });

  describe('Dataset schema updates', () => {
    const testSuiteWithDataset = { ...mockTestSuite, datasetId: 'dataset-1' };

    test('refreshes the TestSuite validation after a successful dataset schema update', async () => {
      const user = userEvent.setup();
      const { updateDataset } = await import('@/src/app/[lang]/datasets/actions');
      (updateDataset as Mock).mockResolvedValue({ success: true });

      render(<TestSuiteView originalTestSuite={testSuiteWithDataset} etag="etag" />);

      await user.click(screen.getByRole('button', { name: 'Update dataset schema' }));

      await waitFor(() => expect(mockRefresh).toHaveBeenCalledOnce());
    });

    test('does not refresh the TestSuite validation after a failed dataset schema update', async () => {
      const user = userEvent.setup();
      const { updateDataset } = await import('@/src/app/[lang]/datasets/actions');
      let resolveUpdate: (result: { success: boolean }) => void = () => undefined;
      (updateDataset as Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
      );

      render(<TestSuiteView originalTestSuite={testSuiteWithDataset} etag="etag" />);
      await user.click(screen.getByRole('button', { name: 'Update dataset schema' }));

      await act(async () => resolveUpdate({ success: false }));

      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  describe('Save double-click guard', () => {
    test('ignores a second Save click while the first request is in flight', async () => {
      const user = userEvent.setup();
      const { updateTestSuite } = await import('@/src/app/[lang]/test-suites/actions');
      (updateTestSuite as Mock).mockImplementation(() => new Promise(() => undefined));

      render(<TestSuiteView originalTestSuite={mockTestSuite} etag="etag" />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);
      await user.click(saveButton);

      expect(updateTestSuite).toHaveBeenCalledOnce();
      expect(saveButton).toBeDisabled();
    });

    test('keeps Save disabled after success until refresh delivers a new etag', async () => {
      const user = userEvent.setup();
      const { updateTestSuite } = await import('@/src/app/[lang]/test-suites/actions');
      (updateTestSuite as Mock).mockResolvedValue({ success: true });

      const { rerender } = render(<TestSuiteView originalTestSuite={mockTestSuite} etag="etag-1" />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
      expect(saveButton).toBeDisabled();

      rerender(<TestSuiteView originalTestSuite={mockTestSuite} etag="etag-2" />);
      await waitFor(() => expect(saveButton).not.toBeDisabled());
    });

    test('keeps Save disabled after a failed request until refresh delivers updated props', async () => {
      const user = userEvent.setup();
      const { updateTestSuite } = await import('@/src/app/[lang]/test-suites/actions');
      (updateTestSuite as Mock).mockResolvedValue({ success: false, errorHeader: 'Error', errorMessage: 'Conflict' });

      const { rerender } = render(<TestSuiteView originalTestSuite={mockTestSuite} etag="etag-1" />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
      expect(saveButton).toBeDisabled();
      expect(updateTestSuite).toHaveBeenCalledOnce();

      rerender(<TestSuiteView originalTestSuite={mockTestSuite} etag="etag-2" />);
      await waitFor(() => expect(saveButton).not.toBeDisabled());
    });
  });
});
