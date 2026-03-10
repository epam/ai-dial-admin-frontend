import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Resources from '../Resources';
import { EntitiesI18nKey } from '@/src/constants/i18n';

describe('Resources', () => {
  test('renders with no containerId', () => {
    render(<Resources />);

    expect(screen.getByText(EntitiesI18nKey.NoResources)).toBeInTheDocument();
  });
});
