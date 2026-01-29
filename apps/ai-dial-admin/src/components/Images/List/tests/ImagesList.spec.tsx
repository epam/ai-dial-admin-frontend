import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import ImagesList from '../ImagesList';
import { ApplicationRoute } from '@/src/types/routes';
import { EntitiesI18nKey } from '@/src/constants/i18n';

describe('ImagesList', () => {
  test('root component renders', () => {
    render(<ImagesList route={ApplicationRoute.McpContainers} imagesList={[]} />);

    expect(screen.getByText(EntitiesI18nKey.NoImages)).toBeInTheDocument();
  });
});
