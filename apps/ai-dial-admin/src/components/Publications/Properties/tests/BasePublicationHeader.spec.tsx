import { ActionType } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import PublicationHeader from '../Header';
import { ButtonsI18nKey } from '../../../../constants/i18n';
describe('BasePublicationHeader', () => {
  test('Should render approve and decline buttons', () => {
    render(
      <PublicationHeader
        onApprove={vi.fn()}
        onDecline={vi.fn()}
        route={ApplicationRoute.PromptPublications}
        action={ActionType.ADD}
      />,
    );
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Decline })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Publish })).toBeInTheDocument();
  });

  test('Should open and confirm approve modal', () => {
    const onApprove = vi.fn();
    render(
      <PublicationHeader
        onApprove={onApprove}
        onDecline={vi.fn()}
        route={ApplicationRoute.PromptPublications}
        action={ActionType.ADD}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Publish }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('Should open and confirm decline modal with reason', () => {
    const onDecline = vi.fn();
    render(
      <PublicationHeader
        onApprove={vi.fn()}
        onDecline={onDecline}
        route={ApplicationRoute.PromptPublications}
        action={ActionType.ADD}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Decline }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('Should render Unpublish button for REMOVE action', () => {
    render(
      <PublicationHeader
        onApprove={vi.fn()}
        onDecline={vi.fn()}
        route={ApplicationRoute.PromptPublications}
        action={ActionType.REMOVE}
      />,
    );
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Unpublish })).toBeInTheDocument();
  });
});
