import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import Hint from '@/src/components/Common/Sidebar/Hint';

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => {
    return { sidebar: { closeSidebar: () => undefined } };
  }),
}));

describe('Hint', () => {
  test('should render Hint component', () => {
    render(<Hint title="Title" text="Text" />);

    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });
});
