import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import StatusIcon from '@/src/components/Deployments/Common/StatusIndicator/StatusIcon';
import { STATUS_I18N_KEYS } from '@/src/constants/deployments/images';

describe('Common Item component', () => {
  test('component rendered correctly with BUILT status', () => {
    render(<StatusIcon status={IMAGE_STATUS.BUILT} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', STATUS_I18N_KEYS[IMAGE_STATUS.BUILT]);
  });

  test('component rendered correctly with BUILDING status', () => {
    render(<StatusIcon status={IMAGE_STATUS.BUILDING} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', STATUS_I18N_KEYS[IMAGE_STATUS.BUILDING]);
  });
});
