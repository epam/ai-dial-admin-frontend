import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getModelsTokenizers, getModelsTopics } from '@/src/app/[lang]/models/actions';
import TokenizerModelControl from '@/src/components/BaseControls/TokenizerModel';
import TopicsControl from '@/src/components/BaseControls/Topics';
import { ButtonsI18nKey, EntityFieldsI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { DialModelResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import ModelAssetProperties from '../Properties';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModelsTopics: vi.fn(() => Promise.resolve({ success: true, response: ['catalogue-topic'] })),
  getModelsTokenizers: vi.fn(() => Promise.resolve({ success: true, response: [{ id: 'cl100k_base' }] })),
  getModelsAdapters: vi.fn(() => Promise.resolve({ success: true, response: [] })),
}));

const asset = (overrides: Partial<DialModelResource> = {}) =>
  ({ name: 'gpt-4', path: 'gpt-4', folderId: '', ...overrides }) as DialModelResource;

/**
 * DIAL Core owns every field this surface writes. These pin that no admin-backend catalogue read is
 * required to fill them in — without this, a later change could reintroduce a picker that leaves the
 * field uneditable whenever the admin backend is unavailable.
 */
describe('Model asset :: no admin-backend dependency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * The catalogue read fires when the multiselect opens, not on render — so opening it is the only way
   * these assertions can fail. The entity-surface case below is the positive control proving that.
   */
  const openTopics = async () => {
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button')[0]);
  };

  test('Should request the topic catalogue on an entity surface (control for the two below)', async () => {
    render(<TopicsControl entity={{ topics: [] }} view={ApplicationRoute.Models} onChange={vi.fn()} />);
    await openTopics();

    expect(getModelsTopics).toHaveBeenCalled();
  });

  test('Should not request the topic catalogue on the model asset surface', async () => {
    render(
      <TopicsControl entity={{ descriptionKeywords: [] }} view={ApplicationRoute.PlatformModels} onChange={vi.fn()} />,
    );
    await openTopics();

    expect(getModelsTopics).not.toHaveBeenCalled();
  });

  test('Should still let a topic be added on the model asset surface without the catalogue', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TopicsControl entity={{ descriptionKeywords: [] }} view={ApplicationRoute.PlatformModels} onChange={onChange} />,
    );
    await openTopics();

    // Typed entry is the whole point of the unlink: with no catalogue, this is the only way in.
    await user.click(screen.getByText(TopicsI18nKey.AddTopic));
    await user.type(screen.getByRole('textbox'), 'typed-topic');
    await user.click(screen.getByText(ButtonsI18nKey.Apply));

    expect(onChange).toHaveBeenCalledWith({ descriptionKeywords: ['typed-topic'] });
  });

  // With a value set, since the replaced picker gated its fetching grid behind
  // `model.tokenizerModel != null` — so an empty fixture would pass under the old control too.
  test('Should never request the tokenizer catalogue from the model asset Properties', () => {
    render(<ModelAssetProperties asset={asset({ tokenizerModel: 'cl100k_base' })} onChange={vi.fn()} />);

    expect(getModelsTokenizers).not.toHaveBeenCalled();
  });
});

describe('Model asset :: tokenizer is free text', () => {
  test('Should let a tokenizer be typed rather than selected', async () => {
    const onChangeEntity = vi.fn();
    const user = userEvent.setup();

    render(<TokenizerModelControl entity={{}} onChangeEntity={onChangeEntity} />);
    await user.type(screen.getByRole('textbox'), 'x');

    expect(onChangeEntity).toHaveBeenCalledWith({ tokenizerModel: 'x' });
  });

  test('Should render a previously stored value', () => {
    render(<TokenizerModelControl entity={{ tokenizerModel: 'cl100k_base' }} onChangeEntity={vi.fn()} />);

    expect(screen.getByDisplayValue('cl100k_base')).toBeInTheDocument();
  });

  test('Should drop the field entirely when cleared, so Core stores unset rather than an empty string', async () => {
    const onChangeEntity = vi.fn();
    const user = userEvent.setup();

    render(<TokenizerModelControl entity={{ tokenizerModel: 'a' }} onChangeEntity={onChangeEntity} />);
    await user.clear(screen.getByRole('textbox'));

    expect(onChangeEntity).toHaveBeenCalled();
    expect(onChangeEntity.mock.calls.at(-1)?.[0]).not.toHaveProperty('tokenizerModel');
  });
});
