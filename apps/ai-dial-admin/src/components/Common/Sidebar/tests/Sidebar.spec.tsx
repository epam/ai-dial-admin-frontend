import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppContextType, useAppContext } from '@/src/context/AppContext';

import Sidebar from '@/src/components/Common/Sidebar/Sidebar';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { sidebar: { show: true, content: <div>content</div>, position: SidebarPosition.Right } };
  }),
}));

describe('Sidebar', () => {
  test('should render Sidebar component', () => {
    render(<Sidebar />);

    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  test('should not render Sidebar content', () => {
    vi.mocked(useAppContext).mockReturnValue({
      sidebar: { show: false, content: null, position: SidebarPosition.Right },
    } as AppContextType);

    render(<Sidebar />);

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  test('renders the bottom slot (not the right aside) when position is Bottom', () => {
    vi.mocked(useAppContext).mockReturnValue({
      sidebar: { show: true, content: <div>content</div>, position: SidebarPosition.Bottom, collapsed: false },
    } as AppContextType);

    render(<Sidebar slot={SidebarPosition.Bottom} />);

    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  test('a slot only renders when it matches the active position', () => {
    vi.mocked(useAppContext).mockReturnValue({
      sidebar: { show: true, content: <div>content</div>, position: SidebarPosition.Bottom, collapsed: false },
    } as AppContextType);

    // Right slot must stay empty while the sidebar is docked to the bottom.
    render(<Sidebar slot={SidebarPosition.Right} />);

    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });
});
