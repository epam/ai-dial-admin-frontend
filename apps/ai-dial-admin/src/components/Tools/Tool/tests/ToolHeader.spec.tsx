import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import ToolHeader from '../ToolHeader';

const mockCloseSidebar = vi.fn();
const mockShowSidebar = vi.fn();
const mockToggleIsMenuClosed = vi.fn();
const mockToggleSidebar = vi.fn();

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
    sidebarOpen: false,
    toggleSidebar: mockToggleSidebar,
  }),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialNeutralButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

describe('ToolHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders Try Out button for editable admins', () => {
    render(<ToolHeader tool={{ name: 'tool-1' } as any} toolSetName="toolset-1" />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.TryOut })).toBeInTheDocument();
  });

  test('hides Try Out button for read-only admins', () => {
    render(<ToolHeader tool={{ name: 'tool-1' } as any} toolSetName="toolset-1" disabled />);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.TryOut })).not.toBeInTheDocument();
  });
});
