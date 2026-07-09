import { ErrorI18nKey } from '@/src/constants/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Page403 from './Page403';

describe('Page403', () => {
  test('Should render forbidden page with badge, title, and messages', () => {
    const { container } = render(<Page403 />);
    expect(screen.getByText(ErrorI18nKey.Error403)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.AccessForbidden)).toBeInTheDocument();
    expect(container).toHaveTextContent(ErrorI18nKey.NoPermission);
    expect(container).toHaveTextContent(ErrorI18nKey.ContactAdmin);
  });
});
