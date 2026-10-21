import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import JsonToggle from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';

/**
 * Both controls are rendered by every entity page, so the 2.0 generation is opt-in: a page asks for it
 * as it finishes its own migration. What these assert is that the default is unchanged for everyone
 * else, and that the opt-in actually reaches the kit — the 1.0 and 2.0 controls differ in the role the
 * switch announces and in the class the buttons carry, which is what a caller and a screen reader see.
 */
describe('EntityHeaderControls — design-system opt-in', () => {
  test('draws the 1.0 change bar by default', () => {
    render(<ChangedEntityButtons onDiscard={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save }).className).toContain('dial-primary');
  });

  test('draws the 2.0 change bar when the page opts in', () => {
    render(<ChangedEntityButtons isDesignSystem2 onDiscard={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save }).className).toContain('dial-kit-primary');
  });

  // The 1.0 switch leaves its input unnamed — the label is a sibling node — which is one more reason
  // the 2.0 one is worth opting into.
  test('draws the 1.0 switch by default', () => {
    render(<JsonToggle onToggleEditor={vi.fn()} />);

    expect(screen.queryByRole('switch', { name: EntitiesI18nKey.JSONEditor })).toBeNull();
    expect(screen.getByText(EntitiesI18nKey.JSONEditor)).toBeTruthy();
  });

  test('draws the 2.0 switch when the page opts in, which announces as a switch', () => {
    render(<JsonToggle isDesignSystem2 onToggleEditor={vi.fn()} />);

    expect(screen.getByRole('switch', { name: EntitiesI18nKey.JSONEditor })).toBeTruthy();
  });
});
