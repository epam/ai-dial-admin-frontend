import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';

const recordedProps: Record<string, unknown>[] = [];

// The catalogue fetch happens inside the multiselect, and its trigger is a div with no accessible
// role, so it cannot be driven by a role or label query. Mocking the child (testing rules §4.5) and
// asserting the prop that decides the fetch proves the wiring without depending on ui-kit internals —
// and unlike a render-only assertion, it fails if the gate is removed.
vi.mock('@/src/components/Common/Multiselect/Multiselect', () => ({
  default: (props: Record<string, unknown>) => {
    recordedProps.push(props);
    return <div />;
  },
}));

const getModelsTopics = vi.fn();
vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModelsTopics: () => getModelsTopics(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const TopicsControl = (await import('@/src/components/BaseControls/Topics')).default;

const renderTopics = (view?: ApplicationRoute) => {
  render(<TopicsControl entity={{ topics: ['existing'] }} view={view} onChange={vi.fn()} />);
  return recordedProps[recordedProps.length - 1];
};

describe('TopicsControl :: catalogue fetch by surface', () => {
  beforeEach(() => {
    recordedProps.length = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test('offers no catalogue on Assets > App Runners', () => {
    expect(renderTopics(ApplicationRoute.AssetsAppRunners).getItems).toBeUndefined();
  });

  test('offers no catalogue on Assets > Models', () => {
    expect(renderTopics(ApplicationRoute.AssetsModels).getItems).toBeUndefined();
  });

  // Positive controls — without these, the assertions above would pass even if the catalogue had
  // been dropped for every surface.
  test('still offers the catalogue on Entities > Application Runners', () => {
    expect(renderTopics(ApplicationRoute.ApplicationRunners).getItems).toBeInstanceOf(Function);
  });

  test('still offers the catalogue on Entities > Models', () => {
    expect(renderTopics(ApplicationRoute.Models).getItems).toBeInstanceOf(Function);
  });

  test('still offers the catalogue when no view is given', () => {
    expect(renderTopics(undefined).getItems).toBeInstanceOf(Function);
  });

  test('seeds the control from the resource so topics stay addable without a catalogue', () => {
    const props = renderTopics(ApplicationRoute.AssetsAppRunners);

    expect(props.selectedItems).toEqual(['existing']);
    expect(props.allItems).toEqual(['existing']);
    expect(props.addTitle).toBeDefined();
  });
});
