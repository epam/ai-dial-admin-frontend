import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Tools from '../Tools';
import { EntitiesI18nKey } from '@/src/constants/i18n';

describe('Tools', () => {
  test('renders with no containerId', () => {
    render(<Tools />);

    expect(screen.getByText(EntitiesI18nKey.NoTools)).toBeInTheDocument();
  });
});
