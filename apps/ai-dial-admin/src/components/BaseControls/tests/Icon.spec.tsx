import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import IconControl from '@/src/components/BaseControls/Icon';

describe('EntityIcon', () => {
  test('renders Field and FilledIcon when iconUrl is present', () => {
    render(<IconControl iconUrl="icon.png" />);
    expect(screen.getByRole('icon')).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.iconUrl)).toBeInTheDocument();
  });

  test('renders Field and FilledIcon with https url', () => {
    render(<IconControl iconUrl="https://cdn/icon.png" />);
    expect(screen.getByRole('icon')).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.iconUrl)).toBeInTheDocument();
  });

  test('renders Field and None if no iconUrl and readonly', () => {
    render(<IconControl readonly />);
    expect(screen.getByText(BasicI18nKey.None)).toBeInTheDocument();
  });
});
