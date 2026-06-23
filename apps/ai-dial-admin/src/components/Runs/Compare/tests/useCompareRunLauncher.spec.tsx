import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCompareRunLauncher } from '../useCompareRunLauncher';

const getRunsMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRuns: (...args: unknown[]) => getRunsMock(...args),
}));

vi.mock('../SelectCompareRunModal', () => ({
  default: ({ onApply, onClose }: { onApply: (id: string) => void; onClose: () => void }) => (
    <div>
      <button type="button" onClick={() => onApply('run-sibling')}>
        apply-compare
      </button>
      <button type="button" onClick={onClose}>
        close-compare
      </button>
    </div>
  ),
}));

const TestHarness: FC = () => {
  const { openCompareRun, compareRunModal } = useCompareRunLauncher();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          openCompareRun({
            id: 'run-1',
            testSuiteId: 'suite-1',
            testRunName: 'Run #316',
          })
        }
      >
        Compare
      </button>
      {compareRunModal}
    </>
  );
};

describe('useCompareRunLauncher', () => {
  beforeEach(() => {
    getRunsMock.mockReset();
    vi.spyOn(window, 'open').mockImplementation(() => null);
    getRunsMock.mockResolvedValue({
      content: [
        { id: 'run-1', testSuiteId: 'suite-1', status: 'COMPLETED' },
        { id: 'run-sibling', testSuiteId: 'suite-1', testRunName: 'Run #317', status: 'COMPLETED' },
      ],
    });
  });

  test('opens select run modal on openCompareRun', async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole('button', { name: 'Compare' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'apply-compare' })).toBeInTheDocument();
    });
  });

  test('opens compare page in new tab on confirm', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<TestHarness />);

    await user.click(screen.getByRole('button', { name: 'Compare' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'apply-compare' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'apply-compare' }));

    expect(windowOpenSpy).toHaveBeenCalledWith('/runs/compare?runs=run-1,run-sibling', '_blank');
  });
});
