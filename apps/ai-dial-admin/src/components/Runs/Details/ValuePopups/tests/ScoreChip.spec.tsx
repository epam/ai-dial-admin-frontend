import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ScoreChip from '@/src/components/Runs/Details/ValuePopups/ScoreChip';
import { ErrorI18nKey } from '@/src/constants/i18n';

describe('ScoreChip', () => {
  test('shows a zero score as a chip in the lowest absolute bucket', () => {
    render(<ScoreChip raw="0" isFailed={false} />);

    expect(screen.getByText('0')).toHaveClass('bg-score-abs-00', 'text-score-abs-00', 'px-3', 'py-2', 'rounded');
  });

  test('shows a perfect score as a chip in the top absolute bucket', () => {
    render(<ScoreChip raw="1" isFailed={false} />);

    expect(screen.getByText('1')).toHaveClass('bg-score-abs-11', 'text-score-abs-11');
  });

  test('shows the error label as plain error-coloured text for a failed metric', () => {
    render(<ScoreChip raw={null} isFailed />);

    const chip = screen.getByText(ErrorI18nKey.Error);
    expect(chip).toHaveClass('text-error');
    expect(chip.className).not.toContain('score-');
    expect(chip.className).not.toContain('bg-');
  });

  test('prefers the error label over a value on a failed metric', () => {
    render(<ScoreChip raw="0.5" isFailed />);

    expect(screen.getByText(ErrorI18nKey.Error)).toBeInTheDocument();
    expect(screen.queryByText('0.5')).toBeNull();
  });

  test('shows a dash for a value that was never produced', () => {
    render(<ScoreChip raw={null} isFailed={false} />);

    expect(screen.getByText('—')).toHaveClass('text-primary');
  });

  test('shows a non-score value as plain text', () => {
    render(<ScoreChip raw="pass" isFailed={false} />);

    expect(screen.getByText('pass').className).not.toContain('score-');
  });
});
