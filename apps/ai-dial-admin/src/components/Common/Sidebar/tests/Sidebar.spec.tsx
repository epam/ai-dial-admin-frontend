import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppContextType, useAppContext } from '@/src/context/AppContext';

import Sidebar from '@/src/components/Common/Sidebar/Sidebar';
import { DockPosition } from '@/src/components/Common/Sidebar/models';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { sidebar: { show: true, content: <div>content</div> } };
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
      sidebar: { show: false, content: null },
    } as AppContextType);

    render(<Sidebar />);

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  test('renders a right-side aside (not a bottom overlay) when not dockable', () => {
    vi.mocked(useAppContext).mockReturnValue({
      sidebar: { show: true, content: <div>content</div>, dockable: false, dockPosition: DockPosition.Bottom },
    } as AppContextType);

    render(<Sidebar />);

    // Not dockable → position is ignored, standard right aside is used.
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  test('renders a fixed bottom overlay with a resize handle when docked to the bottom', () => {
    vi.mocked(useAppContext).mockReturnValue({
      sidebar: { show: true, content: <div>content</div>, dockable: true, dockPosition: DockPosition.Bottom },
    } as AppContextType);

    render(<Sidebar />);

    // Bottom overlay is not the right-side aside; it exposes a resize separator handle.
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
