import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BasePublicationPermissions from '../BasePublicationPermissions';
import { PopUpState } from '@/src/types/pop-up';
import { ButtonsI18nKey } from '@/src/constants/i18n';

const rules = [{ id: 'r1' }];
const folderId = '/folder';

describe('BasePublicationPermissions', () => {
  it('renders structure and compare buttons', async () => {
    render(<BasePublicationPermissions rules={rules} folderId={folderId} showCompare={true} />);
    await waitFor(() => {
      expect(screen.getByText(ButtonsI18nKey.ReviewStructure)).toBeInTheDocument();
      expect(screen.getByText(/CompareChanges/)).toBeInTheDocument();
    });
  });
});
