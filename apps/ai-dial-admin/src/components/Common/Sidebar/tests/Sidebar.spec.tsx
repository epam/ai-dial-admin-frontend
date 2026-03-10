import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppContextType, useAppContext } from '@/src/context/AppContext';

import Sidebar from '@/src/components/Common/Sidebar/Sidebar';

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
});
