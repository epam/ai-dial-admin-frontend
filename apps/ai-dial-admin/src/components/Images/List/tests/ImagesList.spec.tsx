import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import ImagesList from '../ImagesList';
import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey, EntitiesI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';

describe('ImagesList', () => {
  const renderList = (imagesList: Image[] = []) =>
    render(<ImagesList route={ApplicationRoute.McpContainers} imagesList={imagesList} />);

  test('root component renders', () => {
    renderList();

    expect(screen.getByText(EntitiesI18nKey.NoImages)).toBeInTheDocument();
  });

  test('renders the list title as a heading with the header actions', () => {
    renderList();

    expect(screen.getByRole('heading', { name: ImagesI18nKey.ImagesListTitle })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.GlobalFirewall })).toBeInTheDocument();
  });

  test('offers the columns toggle from the list shell once there are images', () => {
    renderList([{ name: 'img' } as Image]);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Columns })).toBeInTheDocument();
  });

  test('hides the columns toggle when there are no images', () => {
    renderList();

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Columns })).toBeNull();
  });
});
