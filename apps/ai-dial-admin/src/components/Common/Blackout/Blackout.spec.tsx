import { render, screen } from '@testing-library/react';
import * as useIsMobileScreenHook from '@/src/hooks/use-is-mobile-screen';
import * as AppContext from '@/src/context/AppContext';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Blackout from './Blackout';

describe('Common components :: Blackout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  test('renders blackout div when mobile and sidebar is open', () => {
    vi.spyOn(useIsMobileScreenHook, 'useIsMobileScreen').mockReturnValue(true);
    vi.spyOn(AppContext, 'useAppContext').mockReturnValue({ sidebarOpen: true } as any);

    render(<Blackout />);
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  test('does not render when not mobile', async () => {
    vi.spyOn(useIsMobileScreenHook, 'useIsMobileScreen').mockReturnValue(true);
    vi.spyOn(AppContext, 'useAppContext').mockReturnValue({ sidebarOpen: false } as any);

    const { default: BlackoutNotMobile } = await import('./Blackout');
    render(<BlackoutNotMobile />);
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
  });
});
