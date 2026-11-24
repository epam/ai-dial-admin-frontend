import { ButtonAppearance } from '@epam/ai-dial-ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';
import { ButtonsI18nKey } from '@/src/constants/i18n';

describe('Common components :: RemoveButton', () => {
  describe('RemoveButton — icon only', () => {
    test('is named by the Delete label by default', () => {
      render(<RemoveButton onClick={vi.fn()} />);

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Delete })).toBeTruthy();
    });

    test('takes a caller aria-label over the default', () => {
      render(<RemoveButton aria-label="Delete row 3" onClick={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Delete row 3' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Delete })).toBeNull();
    });

    test('draws a borderless ghost button with an error-colored icon', () => {
      render(<RemoveButton onClick={vi.fn()} />);

      const button = screen.getByRole('button');

      expect(button.className).toContain('ghost');
      expect(button.className).not.toContain('outlined');
      expect(button.querySelector('svg')).toHaveClass('text-error');
    });

    test('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<RemoveButton onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledOnce();
    });

    test('greys the icon out when disabled', () => {
      render(<RemoveButton disabled onClick={vi.fn()} />);

      const icon = screen.getByRole('button').querySelector('svg');

      expect(icon).toHaveClass('text-controls-disable');
      expect(icon).not.toHaveClass('text-error');
    });

    test('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<RemoveButton disabled onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('RemoveButton — labelled', () => {
    test('is named by its label', () => {
      render(<RemoveButton label={ButtonsI18nKey.Delete} onClick={vi.fn()} />);

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Delete })).toBeTruthy();
    });

    test('draws a bordered danger button', () => {
      render(<RemoveButton label={ButtonsI18nKey.Delete} onClick={vi.fn()} />);

      const button = screen.getByRole('button');

      expect(button.className).toContain('danger');
      expect(button.className).toContain('outlined');
    });

    test('supports a ghost danger button when requested', () => {
      render(<RemoveButton label={ButtonsI18nKey.Delete} appearance={ButtonAppearance.Ghost} onClick={vi.fn()} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('danger');
      expect(button.className).toContain('ghost');
    });

    test('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<RemoveButton label={ButtonsI18nKey.Delete} onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});
