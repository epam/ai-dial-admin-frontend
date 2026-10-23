import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';
import EditOverallScoreModal from '../EditOverallScoreModal';

vi.mock('../OverallScore', () => ({
  default: ({ selectedTestSuite, onChange }: any) => (
    <button
      type="button"
      onClick={() =>
        onChange({
          ...selectedTestSuite,
          overallScore: { type: OverallScoreType.Mean },
          testCaseOverallScore: { type: OverallScoreType.Mean },
        })
      }
    >
      set-mean
    </button>
  ),
}));

vi.mock('../ScoreThreshold', () => ({ default: () => <div>score-threshold</div> }));

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<any>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    ConfirmationPopup: ({ open, header, onConfirm, onClose, confirmLabel, disableConfirmButton, children }: any) =>
      open ? (
        <div role="dialog" aria-label={header}>
          {children}
          <button type="button" onClick={onConfirm} disabled={disableConfirmButton}>
            {confirmLabel}
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      ) : null,
  };
});

describe('EditOverallScoreModal', () => {
  test('Apply normalizes mean by clearing testCaseOverallScore', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onClose = vi.fn();
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      overallScore: { type: OverallScoreType.Function, expression: { entity: 'eval_summaries' } as any },
      testCaseOverallScore: { type: OverallScoreType.Mean },
    };

    render(<EditOverallScoreModal isOpen selectedTestSuite={selectedTestSuite} onApply={onApply} onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: TestSuitesI18nKey.EditOverallScore })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'set-mean' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));

    expect(onApply).toHaveBeenCalledWith({
      id: 'suite-1',
      overallScore: { type: OverallScoreType.Mean },
    });
    expect(onClose).toHaveBeenCalled();
  });
});
