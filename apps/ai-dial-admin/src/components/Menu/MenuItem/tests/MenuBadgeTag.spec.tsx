import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { BasicI18nKey } from '@/src/constants/i18n';
import { MenuBadge } from '../../menu-configuration';
import MenuBadgeTag from '../MenuBadgeTag';

describe('MenuBadgeTag', () => {
  test('renders the Preview label for the Preview badge', () => {
    render(<MenuBadgeTag badge={MenuBadge.Preview} />);

    expect(screen.getByText(BasicI18nKey.Preview)).toBeInTheDocument();
  });

  test('renders the Deprecated label for the Deprecated badge', () => {
    render(<MenuBadgeTag badge={MenuBadge.Deprecated} />);

    expect(screen.getByText(BasicI18nKey.Deprecated)).toBeInTheDocument();
  });
});
