import { ErrorI18nKey } from '@/src/constants/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Page403 from './Page403';

describe('Page403', () => {
  test('Should render forbidden page with icon and messages', () => {
    render(<Page403 />);
    expect(screen.getByText(ErrorI18nKey.AccessForbidden)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.AccessDenied)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.AccessRefer)).toBeInTheDocument();
  });
});
