import { BasicI18nKey } from '@/src/constants/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import EntityIcon from '../EntityIcon';

describe('EntityIcon', () => {
  test('renders Field and FilledIcon when iconUrl is present', () => {
    render(<EntityIcon fieldTitle="Icon" elementId="id1" iconUrl="icon.png" />);
    expect(screen.getByRole('icon')).toBeInTheDocument();
    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  test('renders Field and FilledIcon with https url', () => {
    render(<EntityIcon fieldTitle="Icon" elementId="id1" iconUrl="https://cdn/icon.png" />);
    expect(screen.getByRole('icon')).toBeInTheDocument();
    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  test('renders Field and None if no iconUrl and readonly', () => {
    render(<EntityIcon fieldTitle="Icon" elementId="id1" readonly />);
    expect(screen.getByText(BasicI18nKey.None)).toBeInTheDocument();
  });
});
