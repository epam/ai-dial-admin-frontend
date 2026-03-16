import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import TryOutButton from '../components/TryOutButton';

const mockShowSidebar = vi.fn();
const mockCloseSidebar = vi.fn();
const mockToggleIsMenuClosed = vi.fn();
const mockToggleSidebar = vi.fn();

let sidebarOpen = false;

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: {
      show: false,
      content: null,
      closeSidebar: mockCloseSidebar,
      showSidebar: mockShowSidebar,
      toggleIsMenuClosed: mockToggleIsMenuClosed,
      isMenuClosed: false,
    },
    sidebarOpen,
    toggleSidebar: mockToggleSidebar,
  }),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialNeutralButton: ({ label, onClick }: { label: string; onClick: (event: any) => void }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

vi.mock('@/public/images/icons/tryout.svg', () => ({
  default: () => <svg role="img" aria-label="tryout-icon" />,
}));

vi.mock('../components/TryOut', () => ({
  default: ({ testSuite }: { testSuite: TestSuite }) => (
    <section role="region" aria-label="tryout-content">
      {testSuite?.id}
    </section>
  ),
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Suite 1',
  ...overrides,
});

describe('TryOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sidebarOpen = false;
  });

  test('renders Try Out button label', () => {
    render(<TryOutButton testSuite={createTestSuite()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.TryOut })).toBeInTheDocument();
  });

  test('opens sidebar with try out content and expected width class on click', () => {
    render(<TryOutButton testSuite={createTestSuite({ id: 'suite-42' })} />);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
    expect(mockShowSidebar).toHaveBeenCalledWith(expect.any(Object), 'w-1/2 max-w-[800px] !p-0');

    const sidebarElement = mockShowSidebar.mock.calls[0][0] as {
      props?: { children?: { props?: { testSuite?: TestSuite } } };
    };
    expect(sidebarElement?.props?.children?.props?.testSuite?.id).toBe('suite-42');
  });

  test('stops propagation when button is clicked', () => {
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <TryOutButton testSuite={createTestSuite()} />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(parentClick).not.toHaveBeenCalled();
  });

  test('when sidebar is open, closes menu and toggles sidebar on click', () => {
    sidebarOpen = true;

    render(<TryOutButton testSuite={createTestSuite()} />);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockToggleIsMenuClosed).toHaveBeenCalledTimes(1);
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  test('when sidebar is closed, does not toggle menu state', () => {
    sidebarOpen = false;

    render(<TryOutButton testSuite={createTestSuite()} />);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    expect(mockToggleIsMenuClosed).not.toHaveBeenCalled();
    expect(mockToggleSidebar).not.toHaveBeenCalled();
  });

  test('closes sidebar on unmount', () => {
    const { unmount } = render(<TryOutButton testSuite={createTestSuite()} />);

    unmount();

    expect(mockCloseSidebar).toHaveBeenCalledTimes(1);
  });
});
