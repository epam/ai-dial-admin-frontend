import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import RequestTemplate from '../RequestTemplate';

const mockDispatch = vi.fn();

vi.mock('@/src/context/SaveValidationContext', () => ({
  SaveValidationContextProvider: ({ children }: any) => <div>{children}</div>,
  useSaveValidationContext: () => ({ dispatch: mockDispatch, isValid: true, errorFields: new Map() }),
  ValidationActionType: { SetField: 'SET_FIELD_VALIDATION', Reset: 'RESET' },
}));

const mockShowSidebar = vi.fn();
const mockCloseSidebar = vi.fn();
const mockToggleSidebar = vi.fn();
const mockToggleIsMenuClosed = vi.fn();

let mockSidebarOpen = false;

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: {
      show: false,
      content: null,
      isMenuClosed: false,
      showSidebar: mockShowSidebar,
      closeSidebar: mockCloseSidebar,
      toggleIsMenuClosed: mockToggleIsMenuClosed,
    },
    sidebarOpen: mockSidebarOpen,
    toggleSidebar: mockToggleSidebar,
  }),
}));

vi.mock('../tabs/TabsContent', () => ({
  default: ({ activeTab, selectedTestSuite, onChange }: any) => (
    <div role="tabpanel">
      <span>Active: {activeTab}</span>
      <span>Suite: {selectedTestSuite.name}</span>
      <button onClick={() => onChange({ ...selectedTestSuite, name: 'Modified' })}>Modify</button>
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialNeutralButton: ({ label, onClick, iconBefore }: any) => (
    <button role="button" onClick={onClick}>
      {label}
    </button>
  ),
  DialTabs: ({ tabs, activeTab, onClick }: any) => (
    <div role="tablist">
      {tabs.map((tab: any) => (
        <button key={tab.id} role="tab" aria-selected={tab.id === activeTab} onClick={() => onClick(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  ),
  DialInput: ({ elementId, value, onChange, invalid, error }: any) => (
    <div>
      <input
        role="textbox"
        aria-label={elementId}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        aria-invalid={invalid}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite 1',
  requestTemplate: { content: { urlTemplate: '' } },
  ...overrides,
});

describe('RequestTemplate', () => {
  let mockOnChangeTestSuite: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChangeTestSuite = vi.fn();
    mockSidebarOpen = false;
  });

  test('renders TryOut button', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.TryOut })).toBeInTheDocument();
  });

  test('renders tabs (Body, Parameters, Headers)', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').length).toBeGreaterThanOrEqual(3);
  });

  test('renders TabsContent with Body as default active tab', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.getByText(`Active: ${EntityViewTab.Body}`)).toBeInTheDocument();
  });

  test('renders TabsContent with the test suite name', () => {
    render(
      <RequestTemplate testSuite={createTestSuite({ name: 'My Suite' })} onChangeTestSuite={mockOnChangeTestSuite} />,
    );

    expect(screen.getByText('Suite: My Suite')).toBeInTheDocument();
  });

  test('changes active tab when a tab is clicked', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);

    expect(screen.getByText(`Active: ${EntityViewTab.Parameters}`)).toBeInTheDocument();
  });

  test('renders endpoint method badge when endpointRef.method exists', () => {
    const testSuite = createTestSuite({ endpointRef: { method: 'POST' } });

    render(<RequestTemplate testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByText('POST')).toBeInTheDocument();
  });

  test('does not render endpoint method badge when endpointRef is undefined', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.queryByText('GET')).not.toBeInTheDocument();
    expect(screen.queryByText('POST')).not.toBeInTheDocument();
  });

  test('opens TryOut sidebar on TryOut button click', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), 'w-[50%] max-w-[800px]');
  });

  test('toggles sidebar and menu when sidebar is already open on TryOut click', () => {
    mockSidebarOpen = true;

    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
    expect(mockToggleIsMenuClosed).toHaveBeenCalledTimes(1);
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  test('does not toggle sidebar when sidebar is closed on TryOut click', () => {
    mockSidebarOpen = false;

    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
    expect(mockToggleIsMenuClosed).not.toHaveBeenCalled();
    expect(mockToggleSidebar).not.toHaveBeenCalled();
  });

  test('calls closeSidebar on unmount', () => {
    const { unmount } = render(
      <RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />,
    );

    unmount();

    expect(mockCloseSidebar).toHaveBeenCalledTimes(1);
  });

  test('dispatches SetField validation for urlTemplate on mount', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD_VALIDATION',
      field: 'urlTemplate',
      isValid: true,
    });
  });

  test('shows no URL error when urlTemplate matches relativeUrlPattern regex', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/api/v1/test' },
      endpointRef: { relativeUrlPattern: '/api/v1/.*' },
    });

    render(<RequestTemplate testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('dispatches invalid field when URL does not match pattern', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/wrong' },
      endpointRef: { relativeUrlPattern: '/api/.*' },
    });

    render(<RequestTemplate testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD_VALIDATION',
      field: 'urlTemplate',
      isValid: false,
    });
  });

  test('does not show error when relativeUrlPattern has no regex symbols', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/something' },
      endpointRef: { relativeUrlPattern: '/other' },
    });

    render(<RequestTemplate testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('does not show error when urlTemplate is empty', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '' },
      endpointRef: { relativeUrlPattern: '/api/.*' },
    });

    render(<RequestTemplate testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('does not show error when relativeUrlPattern is undefined', () => {
    const testSuite = createTestSuite({
      requestTemplate: { urlTemplate: '/api/test' },
      endpointRef: { relativeUrlPattern: undefined },
    });

    render(<RequestTemplate testSuite={testSuite} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('TabsContent onChange propagates to onChangeTestSuite', () => {
    render(
      <RequestTemplate testSuite={createTestSuite({ name: 'Original' })} onChangeTestSuite={mockOnChangeTestSuite} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Modify' }));

    expect(mockOnChangeTestSuite).toHaveBeenCalledWith(expect.objectContaining({ name: 'Modified' }));
  });
});
