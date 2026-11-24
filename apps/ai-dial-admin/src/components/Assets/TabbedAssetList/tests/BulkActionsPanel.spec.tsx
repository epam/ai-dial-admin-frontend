import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import BulkActionsPanel from '../BulkActionsPanel';

describe('BulkActionsPanel', () => {
  test.each([false, true])(
    'shows the count and only Delete and clear controls in compact mode %s',
    async (isCompact) => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const onClearSelection = vi.fn();
      render(
        <BulkActionsPanel
          selectedCount={3}
          isCompact={isCompact}
          onClearSelection={onClearSelection}
          onDelete={onDelete}
        />,
      );

      const toolbar = screen.getByRole('toolbar', { name: ButtonsI18nKey.BulkActions });
      expect(within(toolbar).getByRole('status')).toHaveTextContent(`3${FileManagerI18nKey.SelectedItems}`);
      expect(within(toolbar).getAllByRole('button')).toHaveLength(2);
      await user.click(within(toolbar).getByRole('button', { name: ButtonsI18nKey.Delete }));
      await user.click(within(toolbar).getByRole('button', { name: BasicI18nKey.ClearSelection }));
      expect(onDelete).toHaveBeenCalledOnce();
      expect(onClearSelection).toHaveBeenCalledOnce();
    },
  );
});
