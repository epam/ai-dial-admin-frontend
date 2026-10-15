import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import JsonToggles from '../JsonToggle/JsonToggle';

describe('JsonToggles', () => {
  test('is enabled by default', () => {
    render(<JsonToggles />);

    expect(screen.getByRole('checkbox', { hidden: true })).toBeEnabled();
  });

  test('is disabled when isEditorDisabled is set', () => {
    render(<JsonToggles isEditorDisabled />);

    expect(screen.getByRole('checkbox', { hidden: true })).toBeDisabled();
  });
});
