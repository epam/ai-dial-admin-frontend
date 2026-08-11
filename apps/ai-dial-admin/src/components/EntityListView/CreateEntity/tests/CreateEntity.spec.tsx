import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { Mock, describe, expect, test, vi } from 'vitest';
import CreateEntity from '../CreateEntity';
import { ApplicationRoute } from '@/src/types/routes';

describe('CreateEntity', () => {
  test('renders popup and adapter properties', () => {
    render(<CreateEntity route={ApplicationRoute.Models} isModalOpen={true} onClose={vi.fn()} names={['model1']} />);
    expect(screen.getByText(CreateI18nKey.Title)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Create)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<CreateEntity route={ApplicationRoute.Models} isModalOpen={true} onClose={onClose} names={[]} />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalled();
  });

  test('does not inject a version into the create body for AssetsModels, unlike AssetsApplications', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createModel = vi.fn().mockResolvedValue({ success: true, response: { name: 'model1' } });
    render(
      <CreateEntity
        route={ApplicationRoute.AssetsModels}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createModel}
      />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await waitFor(() => expect(createModel).toHaveBeenCalled());
    expect(createModel.mock.calls[0][0]).not.toHaveProperty('version');

    const createApp = vi.fn().mockResolvedValue({ success: true, response: { name: 'app1' } });
    render(
      <CreateEntity
        route={ApplicationRoute.AssetsApplications}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createApp}
      />,
    );

    fireEvent.click(screen.getAllByText(ButtonsI18nKey.Create)[1]);

    await waitFor(() => expect(createApp).toHaveBeenCalled());
    expect(createApp.mock.calls[0][0]).toMatchObject({ version: '1.0.0' });
  });

  test('seeds the default display version for AssetsModels', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createModel = vi.fn().mockResolvedValue({ success: true, response: { name: 'model1' } });
    render(
      <CreateEntity
        route={ApplicationRoute.AssetsModels}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createModel}
      />,
    );

    expect(screen.getByDisplayValue('1.0.0')).toBeInTheDocument();

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await waitFor(() => expect(createModel).toHaveBeenCalled());
    expect(createModel.mock.calls[0][0]).toMatchObject({ displayVersion: '1.0.0' });
  });
});
