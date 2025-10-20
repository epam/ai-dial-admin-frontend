import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ActivityAuditI18nKey } from '@/src/constants/i18n';
import ActivityDetails from '../Details';

describe('Activity Details Modal', () => {
  test('Should render component', async () => {
    render(<ActivityDetails auditViewId="id" onClose={vi.fn()} isModalOpen={true} />);

    expect(screen.getByText(ActivityAuditI18nKey.ActivityDetails)).toBeInTheDocument();
  });
});
