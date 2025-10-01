import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ForwardAuthTokenField from '../ForwardAuthTokenField';

const mockFunction = vi.fn();

describe('ForwardToken :: ForwardAuthTokenField', () => {
  test('Should render successfully for Routes', () => {
    render(
      <ForwardAuthTokenField
        entity={{ name: 'entity', forwardAuthToken: true }}
        onChangeEntity={mockFunction}
        view={ApplicationRoute.Routes}
      />,
    );
    expect(screen.getByText(EntityFieldsI18nKey.forwardAuthToken)).toBeInTheDocument();
  });
});
