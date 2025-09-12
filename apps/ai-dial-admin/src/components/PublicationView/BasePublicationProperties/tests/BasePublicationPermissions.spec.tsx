import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BasePublicationPermissions from '../BasePublicationPermissions';
import { PopUpState } from '@/src/types/pop-up';
import { ButtonsI18nKey } from '../../../../constants/i18n';

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

  it('opens RulesStructure modal on structure button click', async () => {
    render(<BasePublicationPermissions rules={rules} folderId={folderId} showCompare={true} />);
    const structureBtn = await screen.findByText(ButtonsI18nKey.ReviewStructure);
    fireEvent.click(structureBtn);
    expect(screen.getByText('RulesStructure ' + PopUpState.Opened)).toBeInTheDocument();
  });

  it('opens RulesCompare modal on compare button click', async () => {
    render(<BasePublicationPermissions rules={rules} folderId={folderId} showCompare={true} />);
    const compareBtn = await screen.findByText(/CompareChanges/);
    fireEvent.click(compareBtn);
    expect(screen.getByText('RulesCompare ' + PopUpState.Opened)).toBeInTheDocument();
  });

  it('does not show buttons for ROOT_FOLDER', async () => {
    render(<BasePublicationPermissions rules={rules} folderId={'root/'} showCompare={true} />);
    expect(screen.queryByText(ButtonsI18nKey.ReviewStructure)).not.toBeInTheDocument();
    expect(screen.queryByText(/CompareChanges/)).not.toBeInTheDocument();
  });
});
