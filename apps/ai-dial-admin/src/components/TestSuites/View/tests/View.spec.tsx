import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import TestSuiteView from '../View';

const mockRunTestSuite = vi.fn();
const mockShowNotification = vi.fn();

// Mock the actions
vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  updateTestSuite: vi.fn(),
  removeTestSuite: vi.fn(),
  runTestSuite: (...args: unknown[]) => mockRunTestSuite(...args),
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
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
}));

// RunModal has its own async data-loading (getTestCases) unrelated to error-surfacing;
// mock it down to a single button that invokes `onRun` directly.
vi.mock('@/src/components/TestSuites/Runs/RunModal', () => ({
  default: ({ onRun }: any) => <button onClick={() => onRun(1)}>Submit Run</button>,
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
    onDiscard,
    onSave,
    tabs,
    activeTab,
    onChangeActiveTab,
    jsonConfiguration,
    children,
  }: any) => (
    <div>
      <div>Entity: {entity.name}</div>
      <div>Changed: {isChanged.toString()}</div>
      <button onClick={onDiscard}>Discard</button>
      <button onClick={onSave}>Save</button>
      <button onClick={() => onChangeActiveTab(EntityViewTab.TestCases)}>Change Tab</button>
      <button onClick={jsonConfiguration.onToggleEditor}>Toggle Editor</button>
      {children}
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
    valid: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders TestSuiteView with initial state', () => {
    render(<TestSuiteView originalTestSuite={mockTestSuite} etag="etag" />);

    expect(screen.getByText('Entity: Test Suite 1')).toBeInTheDocument();
    expect(screen.getByText('Changed: false')).toBeInTheDocument();
  });

  test('surfaces backend 409 INVALID_OPERATION message on run creation error', async () => {
    const user = userEvent.setup();
    mockRunTestSuite.mockResolvedValue({
      success: false,
      errorHeader: 'INVALID_OPERATION',
      errorMessage: 'Cannot create a run: MCP suites do not support multi-turn test cases',
      status: 409,
      requestId: 'trace-409',
    });

    render(<TestSuiteView originalTestSuite={mockTestSuite} etag="etag" />);

    await user.click(screen.getByRole('button', { name: 'Buttons.Run' }));
    await user.click(screen.getByRole('button', { name: 'Submit Run' }));

    expect(mockRunTestSuite).toHaveBeenCalledWith('test-suite-1', 1);
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'INVALID_OPERATION',
        description: 'Cannot create a run: MCP suites do not support multi-turn test cases',
        requestId: 'trace-409',
      }),
    );
  });
});
