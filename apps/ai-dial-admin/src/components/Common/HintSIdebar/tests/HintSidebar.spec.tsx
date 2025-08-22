import { describe, expect, test, Mock, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import HintSidebar from '@/src/components/Common/HintSIdebar/HintSidebar';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { hintSidebar: { show: true, content: <div>content</div> } };
  }),
}));

describe('HintSidebar', () => {
  test('should render HintSidebar component', () => {
    render(<HintSidebar />);

    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
