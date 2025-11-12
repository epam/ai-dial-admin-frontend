import { ButtonsI18nKey } from '@/src/constants/i18n';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import PublicationPermissions from '../Permissions';

const rules = [{ id: 'r1' }];
const folderId = '/folder';

describe('BasePublicationPermissions', () => {
  test('renders structure and compare buttons', async () => {
    render(<PublicationPermissions rules={rules} folderId={folderId} showCompare={true} />);
    await waitFor(() => {
      expect(screen.getByText(ButtonsI18nKey.ReviewStructure)).toBeInTheDocument();
      expect(screen.getByText(/CompareChanges/)).toBeInTheDocument();
    });
  });
});
