import { ErrorI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { describe, expect, test, vi } from 'vitest';
import Page404 from './Page404';

describe('Page404', () => {
  test('Should render not found page with messages and button', async () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as ReturnType<typeof useRouter>);

    const user = userEvent.setup();
    render(<Page404 />);

    expect(screen.getByText(ErrorI18nKey.Page404Code)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.Page404Title)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.Page404Description)).toBeInTheDocument();

    const button = screen.getByRole('button', { name: ErrorI18nKey.Page404HomeButton });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(mockPush).toHaveBeenCalledWith(ApplicationRoute.Home);
  });
});
