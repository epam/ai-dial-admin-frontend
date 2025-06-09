import Blackout from './Blackout';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { screen } from '@testing-library/react';
import * as useIsMobileScreenHook from '@/src/hooks/use-is-mobile-screen';
import * as AppContext from '@/src/context/AppContext';

describe('Common components :: Blackout', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('Should render successfully', () => {
    jest.spyOn(useIsMobileScreenHook, 'useIsMobileScreen').mockReturnValue(true);
    jest.spyOn(AppContext, 'useAppContext').mockReturnValue({ sidebarOpen: true } as any);

    renderWithContext(<Blackout />);
    const blackout = screen.getByRole('presentation');
    expect(blackout).toBeInTheDocument();
  });

  it('Should not render blackout when sidebar is closed on mobile', () => {
    jest.spyOn(useIsMobileScreenHook, 'useIsMobileScreen').mockReturnValue(true);
    jest.spyOn(AppContext, 'useAppContext').mockReturnValue({ sidebarOpen: false } as any);

    renderWithContext(<Blackout />);
    const blackout = screen.queryByRole('presentation');
    expect(blackout).not.toBeInTheDocument();
  });
});
