import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import EntityHeader from '../Header';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';

describe('EntityHeader', () => {
  test('renders header with entity and route', () => {
    const updatedAt = new Date('2020-12-12T12:00:00Z');
    const createdAt = new Date('2020-11-12T12:00:00Z');
    const entity = { name: 'Test Entity', id: '123', updatedAt, createdAt };

    render(<EntityHeader entity={entity} />);

    expect(screen.getByText(EntityFieldsI18nKey.updatedAt)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.createdAt)).toBeInTheDocument();
    expect(screen.getByText(updatedAt.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(createdAt.toLocaleString())).toBeInTheDocument();
  });
});
