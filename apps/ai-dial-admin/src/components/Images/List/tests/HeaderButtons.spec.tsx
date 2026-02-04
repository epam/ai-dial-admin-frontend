import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import HeaderButtons from '../HeaderButtons';
import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey } from '@/src/constants/i18n';

describe('HeaderButtons', () => {
  test('root component renders', () => {
    render(<HeaderButtons route={ApplicationRoute.McpContainers} toggleColumnsPanel={vi.fn()} gridApi={null} />);

    expect(screen.getByText(ButtonsI18nKey.Columns)).toBeInTheDocument();
  });
});
