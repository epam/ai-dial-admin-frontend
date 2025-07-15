import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import EntityHeader from '../Header';
import { EntitiesI18nKey } from '@/src/constants/i18n';

describe('EntityHeader', () => {
  test('renders header with entity and route', () => {
    const updatedAt = new Date();
    const createdAt = new Date();
    const entity = { name: 'Test Entity', id: '123', updatedAt, createdAt };

    render(<EntityHeader entity={entity} />);

    expect(screen.getByText(EntitiesI18nKey.UpdatedAt)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.CreatedAt)).toBeInTheDocument();
    expect(screen.getByText(updatedAt.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(createdAt.toLocaleString())).toBeInTheDocument();
  });
});
