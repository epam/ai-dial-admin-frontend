import { ButtonsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { describe, expect, test, vi } from 'vitest';
import Page404 from './Page404';

describe('Page404', () => {
  test('Should render not found page with badge, title, messages, and buttons', () => {
    const { container } = render(<Page404 />);
    expect(screen.getByText(ErrorI18nKey.Error404)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.PageNotFound)).toBeInTheDocument();
    expect(container).toHaveTextContent(ErrorI18nKey.ResourceNotFound);
    expect(container).toHaveTextContent(ErrorI18nKey.ReturnToHomepage);
    expect(screen.getByText(ButtonsI18nKey.GoToHomepage)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.GoBack)).toBeInTheDocument();
  });

  test('Should navigate to home when GoToHomepage is clicked', async () => {
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    const user = userEvent.setup();
    render(<Page404 />);
    await user.click(screen.getByText(ButtonsI18nKey.GoToHomepage));
    expect(push).toHaveBeenCalledWith(ApplicationRoute.Home);
  });

  test('Should go back when GoBack is clicked', async () => {
    const back = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ back } as unknown as ReturnType<typeof useRouter>);
    const user = userEvent.setup();
    render(<Page404 />);
    await user.click(screen.getByText(ButtonsI18nKey.GoBack));
    expect(back).toHaveBeenCalled();
  });
});
