import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { render, screen, waitFor } from '@testing-library/react';
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
vi.mock('./TabsContent', () => ({
  default: ({ activeTab, selectedTestSuite, onChange }: any) => (
    <div>
      <div>Active Tab: {activeTab}</div>
      <div>Test Suite: {selectedTestSuite.name}</div>
      <button onClick={() => onChange({ ...selectedTestSuite, name: 'Modified Suite' })}>Modify Suite</button>
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

    test('re-enables Save once the request completes', async () => {
      const user = userEvent.setup();
      const { updateTestSuite } = await import('@/src/app/[lang]/test-suites/actions');
      (updateTestSuite as Mock).mockResolvedValue({ success: true });

      render(<TestSuiteView originalTestSuite={mockTestSuite} etag="etag" />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => expect(saveButton).not.toBeDisabled());
      expect(mockRefresh).toHaveBeenCalled();
    });

    test('re-enables Save after a failed request, so the user can retry', async () => {
      const user = userEvent.setup();
      const { updateTestSuite } = await import('@/src/app/[lang]/test-suites/actions');
      (updateTestSuite as Mock).mockResolvedValue({ success: false, errorHeader: 'Error', errorMessage: 'Conflict' });

      render(<TestSuiteView originalTestSuite={mockTestSuite} etag="etag" />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => expect(saveButton).not.toBeDisabled());
      expect(updateTestSuite).toHaveBeenCalledOnce();
    });
  });
});
