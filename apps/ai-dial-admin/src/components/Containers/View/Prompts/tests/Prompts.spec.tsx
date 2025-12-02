import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Prompts from '../Prompts';
import { EntitiesI18nKey } from '@/src/constants/i18n';

describe('Prompts', () => {
  test('renders with no containerId', () => {
    render(<Prompts />);

    expect(screen.getByText(EntitiesI18nKey.NoPrompts)).toBeInTheDocument();
  });
});
