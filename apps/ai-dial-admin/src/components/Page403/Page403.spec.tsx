import { ErrorI18nKey } from '@/src/constants/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Page403 from './Page403';

describe('Page403', () => {
  test('Should render forbidden page with code, title and description', () => {
    render(<Page403 />);
    expect(screen.getByText(ErrorI18nKey.Page403Code)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.Page403Title)).toBeInTheDocument();
    expect(screen.getByText(ErrorI18nKey.Page403Description)).toBeInTheDocument();
  });
});
