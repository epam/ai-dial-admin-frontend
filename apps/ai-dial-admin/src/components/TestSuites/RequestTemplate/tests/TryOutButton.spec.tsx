import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import TryOutButton from '../components/TryOutButton';

const mockShowSidebar = vi.fn();
const mockCloseSidebar = vi.fn();
const mockToggleSidebar = vi.fn();
const mockToggleIsMenuClosed = vi.fn();

let mockSidebarOpen = false;

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: {
      showSidebar: mockShowSidebar,
      closeSidebar: mockCloseSidebar,
      toggleIsMenuClosed: mockToggleIsMenuClosed,
    },
    sidebarOpen: mockSidebarOpen,
    toggleSidebar: mockToggleSidebar,
  }),
}));

vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string) => key,
}));

vi.mock('@/src/context/SaveValidationContext', () => ({
  SaveValidationContextProvider: ({ children }: any) => (
    <div role="group" aria-label="Save validation">
      {children}
    </div>
  ),
}));

vi.mock('../components/TryOut', () => ({
  default: ({ testSuiteId }: { testSuiteId: string }) => (
    <div role="region" aria-label={`TryOut ${testSuiteId}`}>
      TryOut {testSuiteId}
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialNeutralButton: ({ label, onClick, iconBefore }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite',
  ...overrides,
});

describe('TryOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSidebarOpen = false;
  });

  test('renders button with TryOut label', () => {
    render(<TryOutButton testSuite={createTestSuite()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.TryOut })).toBeInTheDocument();
  });

  test('calls showSidebar with SaveValidationContextProvider and TryOut when clicked', () => {
    const testSuite = createTestSuite({ id: 'my-suite-id' });

    render(<TryOutButton testSuite={testSuite} />);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), 'w-1/2 max-w-[800px]');
    const [content] = mockShowSidebar.mock.calls[0];
    const { getByRole } = render(content);
    expect(getByRole('group', { name: 'Save validation' })).toBeInTheDocument();
    expect(getByRole('region', { name: 'TryOut my-suite-id' })).toHaveTextContent('TryOut my-suite-id');
  });

  test('passes empty string as testSuiteId when testSuite.id is undefined', () => {
    const testSuite = createTestSuite({ id: undefined });

    render(<TryOutButton testSuite={testSuite} />);
    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockShowSidebar).toHaveBeenCalled();
    const [content] = mockShowSidebar.mock.calls[0];
    const { getByRole } = render(content);
    const tryOutEl = getByRole('region', { name: /^TryOut\s*$/ });
    expect(tryOutEl).toBeInTheDocument();
    expect(tryOutEl.textContent).toMatch(/^TryOut\s*$/);
  });

  test('stops propagation on click', () => {
    const testSuite = createTestSuite();
    const parentHandler = vi.fn();

    render(
      <div onClick={parentHandler}>
        <TryOutButton testSuite={testSuite} />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockShowSidebar).toHaveBeenCalled();
    expect(parentHandler).not.toHaveBeenCalled();
  });

  test('does not call toggleIsMenuClosed or toggleSidebar when sidebar is closed', () => {
    mockSidebarOpen = false;

    render(<TryOutButton testSuite={createTestSuite()} />);
    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
    expect(mockToggleIsMenuClosed).not.toHaveBeenCalled();
    expect(mockToggleSidebar).not.toHaveBeenCalled();
  });

  test('calls toggleIsMenuClosed and toggleSidebar when sidebar is already open', () => {
    mockSidebarOpen = true;

    render(<TryOutButton testSuite={createTestSuite()} />);
    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
    expect(mockToggleIsMenuClosed).toHaveBeenCalledTimes(1);
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  test('calls closeSidebar on unmount', () => {
    const { unmount } = render(<TryOutButton testSuite={createTestSuite()} />);

    unmount();

    expect(mockCloseSidebar).toHaveBeenCalledTimes(1);
  });
});
