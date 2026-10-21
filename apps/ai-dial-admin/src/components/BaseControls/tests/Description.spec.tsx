import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import DescriptionControl from '../Description';

describe('DescriptionControl', () => {
  test('renders without a required marker by default', () => {
    render(<DescriptionControl entity={{ description: '' }} onChangeEntity={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: EntityFieldsI18nKey.description })).toBeInTheDocument();
  });

  test('renders a required marker when required is set', () => {
    render(<DescriptionControl entity={{ description: '' }} onChangeEntity={vi.fn()} required />);

    expect(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.description}*` })).toBeInTheDocument();
  });
});
