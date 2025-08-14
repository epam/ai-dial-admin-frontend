import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';
import EntityFeatures from '../Features';
import { FeaturesI18nKey } from '@/src/constants/i18n';

describe.skip('EntityFeatures', () => {
  test('renders all text and switch fields for models view', () => {
    const entity = {
      features: {
        RateEndpoint: 'rate',
        TokenizeEndpoint: 'tokenize',
        TemperatureSupported: true,
        SystemPromptSupported: false,
      },
    };
    const onChangeEntity = vi.fn();

    render(<EntityFeatures view={ApplicationRoute.Models} entity={entity} onChangeEntity={onChangeEntity} />);

    // Text fields
    expect(screen.getByText(FeaturesI18nKey.rateEndpoint)).toBeInTheDocument();
    expect(screen.getByText(FeaturesI18nKey.tokenizeEndpoint)).toBeInTheDocument();

    // Switches
    expect(screen.getByText(FeaturesI18nKey.systemPromptSupported)).toBeInTheDocument();
  });

  test('renders nothing for unknown view', () => {
    const entity = { features: {} };
    const onChangeEntity = vi.fn();

    render(<EntityFeatures view={ApplicationRoute.Keys} entity={entity} onChangeEntity={onChangeEntity} />);

    // Should not render any known field titles
    expect(screen.queryByText(FeaturesI18nKey.rateEndpoint)).toBeNull();
    expect(screen.queryByText(FeaturesI18nKey.tokenizeEndpoint)).toBeNull();
    expect(screen.queryByText(FeaturesI18nKey.systemPromptSupported)).toBeNull();
  });
});
