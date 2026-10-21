import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';
import { ButtonsI18nKey } from '@/src/constants/i18n';

describe('Common components :: RemoveButton', () => {
  test('is named by the Delete label by default', () => {
    render(<RemoveButton onClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Delete })).toBeInTheDocument();
  });

  test('takes a caller aria-label over the default', () => {
    render(<RemoveButton aria-label="Delete row 3" onClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Delete row 3' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Delete })).toBeNull();
  });

  test('draws an outlined danger button', () => {
    render(<RemoveButton onClick={vi.fn()} />);

    expect(screen.getByRole('button')).toHaveClass('dial-kit-danger-outlined-button');
  });

  test('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<RemoveButton onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<RemoveButton disabled onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });
});
