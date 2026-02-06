import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import StatusIndicator from '@/src/components/Deployments/Common/StatusIndicator/StatusIndicator';
import { STATUS_I18N_KEYS } from '@/src/constants/deployments/images';

describe('Common Item component', () => {
  test('component rendered correctly with BUILT status', () => {
    render(<StatusIndicator status={IMAGE_STATUS.BUILT} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(STATUS_I18N_KEYS[IMAGE_STATUS.BUILT])).toBeInTheDocument();
  });
});
